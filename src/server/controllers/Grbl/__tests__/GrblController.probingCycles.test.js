/* eslint-env jest */
import GrblController from '../GrblController';

// Regression test for the corner-probe X-edge -> Y-edge transition reported
// to sometimes stop dead at the last X-edge touch with no retract and no
// error, leaving the app stuck until Stop is pressed. Drives a full
// cornerprobe:start cycle through a fake serial harness that answers every
// queued line with the same PRB+ok sequence real grblHAL would send, and
// asserts the cycle actually completes end-to-end with the feeder queue
// fully drained (not stuck waiting on a phantom ack) and the last X-edge
// point's own lines all landing before the first Y-edge line is sent.
describe('GrblController corner probe (X-edge -> Y-edge transition)', () => {
  let controller;
  let sentLines;

  beforeEach(() => {
    controller = new GrblController({}, {
      port: 'FAKE',
      baudrate: 250000,
      rtscts: false,
      pin: {},
    });

    // Parsing a status line is what real hardware triggers ready/init on
    // (see the runner's 'status' handler) -- which schedules a 50ms
    // deferred initController() continuation that would otherwise fire
    // after destroy() has already nulled things out. Pre-set both flags
    // so that path is skipped; all this test needs from the status line
    // is a known machine/work position for the PRB handler's WCO math.
    controller.ready = true;
    controller.initialized = true;
    controller.runner.parse('<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>');

    sentLines = [];

    // Fake hardware: every line the feeder emits gets an immediate 'ok',
    // and every G38.2 additionally gets a triggered PRB report first --
    // same order real grblHAL sends them in (PRB, then ok, as two
    // separate lines).
    controller.feeder.on('data', (line) => {
      sentLines.push(line);

      if (/^G38\.2/.test(line)) {
        controller.runner.emit('parameters', {
          name: 'PRB',
          value: { x: '0.000', y: '0.000', z: '0.000', result: 1 },
          raw: '[PRB:0.000,0.000,0.000:1]',
        });
      }

      controller.runner.emit('ok', { raw: 'ok' });
    });
  });

  afterEach(() => {
    controller.destroy();
  });

  it('completes all 4 points (2 per edge) in one pass with the queue fully drained', () => {
    controller.command('cornerprobe:start', {
      xEdge: {
        start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, pointCount: 2, probeDistance: 5, retractDistance: 2,
      },
      yEdge: {
        start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, pointCount: 2, probeDistance: 5, retractDistance: 2,
      },
      feedrate: 100,
      slowFeedrate: 20,
      backoffDistance: 1,
      settleDelay: 0,
      zLift: 5,
      probeRadius: 0,
    });

    expect(controller.cornerProbeState.probedPositions.length).toBe(4);
    expect(controller.cornerProbeState.result).not.toBeNull();

    // Not stuck: nothing left queued, nothing left "in flight" believing
    // an ack is still owed.
    expect(controller.feeder.size()).toBe(0);
    expect(controller.feeder.isPending()).toBe(false);
    expect(controller.cornerProbeState.pendingAcks).toBe(0);
    expect(controller.cornerProbeState.nextPointIndex).toBeNull();
  });

  it('sends every line of the last X-edge point before the first Y-edge line (closed loop, no interleave)', () => {
    controller.command('cornerprobe:start', {
      xEdge: {
        start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, pointCount: 2, probeDistance: 5, retractDistance: 2,
      },
      yEdge: {
        start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, pointCount: 2, probeDistance: 5, retractDistance: 2,
      },
      feedrate: 100,
      slowFeedrate: 20,
      backoffDistance: 1,
      settleDelay: 0,
      zLift: 5,
      probeRadius: 0,
    });

    // The Y-edge's first point lifts Z before its approach (liftBeforeApproach),
    // so its first line is the retract-before-crossing move.
    const firstYEdgeLineIndex = sentLines.findIndex((line) => line === 'G0 Z5');
    expect(firstYEdgeLineIndex).toBeGreaterThan(-1);

    // Every line up to that point should belong to the X edge -- in
    // particular, the last X-edge point's own trailing retract ('G0 X2',
    // its retractDistance, along the X-edge's probeAxis) must appear
    // before the Z-lift line, not after or interleaved with the next
    // point's approach.
    const linesBeforeTransition = sentLines.slice(0, firstYEdgeLineIndex);
    const xEdgeRetractCount = linesBeforeTransition.filter((line) => line === 'G0 X2').length;
    // One retract per X-edge point (2 points).
    expect(xEdgeRetractCount).toBe(2);
  });
});

// Same closed-loop fields (pendingAcks/nextPointIndex) and 'ok' handler
// branch are shared with plain edge probe -- verify a multi-point
// (3-point) single-edge cycle also completes cleanly, not just corner
// probe's 2-edge case.
describe('GrblController edge probe (multi-point single edge)', () => {
  let controller;
  let sentLines;

  beforeEach(() => {
    controller = new GrblController({}, {
      port: 'FAKE',
      baudrate: 250000,
      rtscts: false,
      pin: {},
    });

    controller.ready = true;
    controller.initialized = true;
    controller.runner.parse('<Idle,MPos:0.000,0.000,0.000,WPos:0.000,0.000,0.000>');

    sentLines = [];

    controller.feeder.on('data', (line) => {
      sentLines.push(line);

      if (/^G38\.2/.test(line)) {
        controller.runner.emit('parameters', {
          name: 'PRB',
          value: { x: '0.000', y: '0.000', z: '0.000', result: 1 },
          raw: '[PRB:0.000,0.000,0.000:1]',
        });
      }

      controller.runner.emit('ok', { raw: 'ok' });
    });
  });

  afterEach(() => {
    controller.destroy();
  });

  it('completes all 3 points with the queue fully drained', () => {
    controller.command('edgeprobe:start', {
      lineAxis: 'y',
      probeAxis: 'x',
      start: { x: 0, y: 0 },
      end: { x: 0, y: 20 },
      pointCount: 3,
      probeDistance: 5,
      feedrate: 100,
      slowFeedrate: 20,
      backoffDistance: 1,
      settleDelay: 0,
      retractDistance: 2,
      probeRadius: 0,
    });

    expect(controller.edgeProbeState.probedPositions.length).toBe(3);
    expect(controller.edgeProbeState.result).not.toBeNull();

    expect(controller.feeder.size()).toBe(0);
    expect(controller.feeder.isPending()).toBe(false);
    expect(controller.edgeProbeState.pendingAcks).toBe(0);
    expect(controller.edgeProbeState.nextPointIndex).toBeNull();

    // Each point's trailing retract (its own line, distinct from the
    // fast-touch backoff) must appear exactly once per point.
    const retractCount = sentLines.filter((line) => line === 'G0 X2').length;
    expect(retractCount).toBe(3);
  });
});
