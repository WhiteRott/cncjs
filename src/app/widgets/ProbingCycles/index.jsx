import get from 'lodash/get';
import includes from 'lodash/includes';
import find from 'lodash/find';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import api from 'app/api';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import log from 'app/lib/log';
import { in2mm, mapValueToUnits } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig';
import EdgeSkewProbe from './EdgeSkewProbe';
import CornerProbe from './CornerProbe';
import {
  // Units
  IMPERIAL_UNITS,
  METRIC_UNITS,
  // Grbl
  GRBL,
  GRBL_ACTIVE_STATE_IDLE,
  // Workflow
  WORKFLOW_STATE_IDLE
} from '../../constants';
import { PROBE_DIRECTIONS, PROBE_TYPES } from './constants';
import styles from './index.styl';

class ProbingCyclesWidget extends PureComponent {
    static propTypes = {
      widgetId: PropTypes.string.isRequired,
      onFork: PropTypes.func.isRequired,
      onRemove: PropTypes.func.isRequired,
      sortable: PropTypes.object
    };

    // Public methods
    collapse = () => {
      this.setState({ minimized: true });
    };

    expand = () => {
      this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
      toggleFullscreen: () => {
        const { minimized, isFullscreen } = this.state;
        this.setState({
          minimized: isFullscreen ? minimized : false,
          isFullscreen: !isFullscreen
        });
      },
      toggleMinimized: () => {
        const { minimized } = this.state;
        this.setState({ minimized: !minimized });
      },
      setProbeType: (value) => {
        this.setState({ probeType: value });
      },
      setDirection: (value) => {
        this.setState({ direction: value });
      },
      setEdgeField: (edgePrefix, field, value) => {
        this.setState({ [`${edgePrefix}${field}`]: value });
      },
      setStartPoint: (point) => {
        this.setState({ startPoint: point });
      },
      setEndPoint: (point) => {
        this.setState({ endPoint: point });
      },
      setPointCount: (value) => {
        this.setState({ pointCount: value });
      },
      setProbeDistance: (value) => {
        this.setState({ probeDistance: value });
      },
      setProbeTipDiameter: (value) => {
        this.setState({ probeTipDiameter: value });
      },
      setProbeFeedrate: (value) => {
        this.setState({ probeFeedrate: value });
      },
      setSlowProbeFeedrate: (value) => {
        this.setState({ slowProbeFeedrate: value });
      },
      setBackoffDistance: (value) => {
        this.setState({ backoffDistance: value });
      },
      setSettleDelay: (value) => {
        this.setState({ settleDelay: value });
      },
      setZLift: (value) => {
        this.setState({ zLift: value });
      },
      setRetractDistance: (value) => {
        this.setState({ retractDistance: value });
      },
      startProbe: () => {
        const {
          direction,
          startPoint,
          endPoint,
          pointCount,
          probeDistance,
          probeFeedrate,
          slowProbeFeedrate,
          backoffDistance,
          settleDelay,
          retractDistance,
          probeTipDiameter,
        } = this.state;
        const dir = find(PROBE_DIRECTIONS, { value: direction });
        if (!dir) {
          return;
        }
        if (this.exceedsMaxTravel() || this.exceedsStylusDeflection()) {
          return;
        }

        this.setState({
          isProbing: true,
          progress: { current: 0, total: pointCount },
          phase: 'moving',
          touchLog: [],
          retryInfo: null,
          error: null,
          result: null,
        });

        controller.command('edgeprobe:start', {
          lineAxis: dir.lineAxis,
          probeAxis: dir.probeAxis,
          start: startPoint,
          end: endPoint,
          pointCount,
          probeDistance: dir.sign * probeDistance,
          feedrate: probeFeedrate,
          slowFeedrate: slowProbeFeedrate,
          backoffDistance,
          settleDelay,
          retractDistance: -dir.sign * retractDistance,
          probeRadius: probeTipDiameter / 2,
        });
      },
      stopProbe: () => {
        controller.command('edgeprobe:stop');
        this.setState({ isProbing: false, phase: null });
      },
      startCornerProbe: () => {
        const {
          xEdgeDirection,
          xEdgeStartPoint,
          xEdgeEndPoint,
          xEdgePointCount,
          xEdgeProbeDistance,
          xEdgeRetractDistance,
          yEdgeDirection,
          yEdgeStartPoint,
          yEdgeEndPoint,
          yEdgePointCount,
          yEdgeProbeDistance,
          yEdgeRetractDistance,
          probeFeedrate,
          slowProbeFeedrate,
          backoffDistance,
          settleDelay,
          zLift,
          probeTipDiameter,
        } = this.state;
        const xDir = find(PROBE_DIRECTIONS, { value: xEdgeDirection });
        const yDir = find(PROBE_DIRECTIONS, { value: yEdgeDirection });
        if (!xDir || !yDir) {
          return;
        }
        if (this.exceedsCornerMaxTravel() || this.exceedsStylusDeflection()) {
          return;
        }

        this.setState({
          isProbing: true,
          progress: { current: 0, total: xEdgePointCount + yEdgePointCount },
          phase: 'moving',
          touchLog: [],
          retryInfo: null,
          error: null,
          result: null,
        });

        controller.command('cornerprobe:start', {
          xEdge: {
            start: xEdgeStartPoint,
            end: xEdgeEndPoint,
            pointCount: xEdgePointCount,
            probeDistance: xDir.sign * xEdgeProbeDistance,
            retractDistance: -xDir.sign * xEdgeRetractDistance,
          },
          yEdge: {
            start: yEdgeStartPoint,
            end: yEdgeEndPoint,
            pointCount: yEdgePointCount,
            probeDistance: yDir.sign * yEdgeProbeDistance,
            retractDistance: -yDir.sign * yEdgeRetractDistance,
          },
          feedrate: probeFeedrate,
          slowFeedrate: slowProbeFeedrate,
          backoffDistance,
          settleDelay,
          zLift,
          probeRadius: probeTipDiameter / 2,
        });
      },
      stopCornerProbe: () => {
        controller.command('cornerprobe:stop');
        this.setState({ isProbing: false, phase: null });
      },
    };

    controllerEvents = {
      'serialport:open': (options) => {
        const { port } = options;
        this.setState({ port: port });
      },
      'serialport:close': (options) => {
        const initialState = this.getInitialState();
        this.setState({ ...initialState });
      },
      'workflow:state': (workflowState) => {
        this.setState(state => ({
          workflow: {
            state: workflowState
          }
        }));
      },
      'controller:settings': (type, settings) => {
        this.setState({ controllerSettings: settings });
      },
      'controller:state': (type, state) => {
        let units = this.state.units;

        if (type === GRBL) {
          const { status, parserstate } = { ...state };
          const { mpos, wpos, pinState } = { ...status };
          const { modal = {} } = { ...parserstate };
          units = {
            'G20': IMPERIAL_UNITS,
            'G21': METRIC_UNITS
          }[modal.units] || units;

          this.setState({
            machinePosition: { ...this.state.machinePosition, ...mpos },
            workPosition: { ...this.state.workPosition, ...wpos },
            probeTriggered: String(pinState || '').includes('P'),
          });
        }

        if (this.state.units !== units) {
          this.unitsDidChange = true;
        }

        this.setState({
          units: units,
          controller: {
            type: type,
            state: state
          },
        });
      },
      'edgeprobe:phase': (data) => {
        const { point, total, phase } = data;
        this.setState({
          phase,
          progress: { current: point, total },
        });
      },
      'edgeprobe:touch': (data) => {
        this.setState(state => ({
          touchLog: [...state.touchLog, data],
          phase: (data.touch < data.touchesPerPoint) ? 'probing-fast' : 'probing-slow',
        }));
      },
      'edgeprobe:retry': (data) => {
        this.setState({
          phase: 'retrying',
          retryInfo: data,
        });
      },
      'edgeprobe:update': (data) => {
        const { current, total } = data;
        this.setState({
          progress: { current, total },
        });
      },
      'edgeprobe:failed': (data) => {
        this.setState({
          isProbing: false,
          phase: null,
          error: data,
        });
      },
      'edgeprobe:complete': (data) => {
        this.setState({
          isProbing: false,
          phase: null,
          result: data,
        });
      },
      'cornerprobe:phase': (data) => {
        const { point, total, phase } = data;
        this.setState({
          phase,
          progress: { current: point, total },
        });
      },
      'cornerprobe:touch': (data) => {
        this.setState(state => ({
          touchLog: [...state.touchLog, data],
          phase: (data.touch < data.touchesPerPoint) ? 'probing-fast' : 'probing-slow',
        }));
      },
      'cornerprobe:retry': (data) => {
        this.setState({
          phase: 'retrying',
          retryInfo: data,
        });
      },
      'cornerprobe:update': (data) => {
        const { current, total } = data;
        this.setState({
          progress: { current, total },
        });
      },
      'cornerprobe:failed': (data) => {
        this.setState({
          isProbing: false,
          phase: null,
          error: data,
        });
      },
      'cornerprobe:complete': (data) => {
        this.setState({
          isProbing: false,
          phase: null,
          result: data,
        });
      },
    };

    unitsDidChange = false;

    componentDidMount() {
      this.addControllerEvents();
      this.loadToolConfig();
    }

    loadToolConfig = async () => {
      try {
        const res = await api.getToolConfig();
        const tool = res.body;
        this.setState({
          toolProbeLength: Number(get(tool, 'toolProbeLength', 0)),
          // toolProbeMaxDeflection was renamed to toolProbeMaxTravel -- see
          // the Tool widget for why. Fall back to the old key so a
          // previously-configured limit isn't silently lost.
          toolProbeMaxTravel: Number(get(tool, 'toolProbeMaxTravel', get(tool, 'toolProbeMaxDeflection', 0))),
          toolProbeMaxStylusDeflection: Number(get(tool, 'toolProbeMaxStylusDeflection', 0)),
        });
      } catch (err) {
        log.error(err);
      }
    };

    componentWillUnmount() {
      this.removeControllerEvents();
    }

    componentDidUpdate(prevProps, prevState) {
      const { minimized } = this.state;
      this.config.set('minimized', minimized);

      if (this.unitsDidChange) {
        this.unitsDidChange = false;
        return;
      }

      const {
        units,
        probeType,
        direction,
        startPoint,
        endPoint,
        pointCount,
        xEdgeDirection,
        xEdgePointCount,
        yEdgeDirection,
        yEdgePointCount,
      } = this.state;
      this.config.set('probeType', probeType);
      this.config.set('direction', direction);
      this.config.set('pointCount', pointCount);
      this.config.set('xEdgeDirection', xEdgeDirection);
      this.config.set('xEdgePointCount', xEdgePointCount);
      this.config.set('yEdgeDirection', yEdgeDirection);
      this.config.set('yEdgePointCount', yEdgePointCount);

      let {
        probeDistance,
        probeFeedrate,
        slowProbeFeedrate,
        backoffDistance,
        retractDistance,
        probeTipDiameter,
        zLift,
        xEdgeProbeDistance,
        xEdgeRetractDistance,
        yEdgeProbeDistance,
        yEdgeRetractDistance,
      } = this.state;
      const { xEdgeStartPoint, xEdgeEndPoint, yEdgeStartPoint, yEdgeEndPoint } = this.state;
      let savedStartPoint = startPoint;
      let savedEndPoint = endPoint;
      let savedXEdgeStartPoint = xEdgeStartPoint;
      let savedXEdgeEndPoint = xEdgeEndPoint;
      let savedYEdgeStartPoint = yEdgeStartPoint;
      let savedYEdgeEndPoint = yEdgeEndPoint;
      if (units === IMPERIAL_UNITS) {
        probeDistance = in2mm(probeDistance);
        probeFeedrate = in2mm(probeFeedrate);
        slowProbeFeedrate = in2mm(slowProbeFeedrate);
        backoffDistance = in2mm(backoffDistance);
        retractDistance = in2mm(retractDistance);
        probeTipDiameter = in2mm(probeTipDiameter);
        zLift = in2mm(zLift);
        xEdgeProbeDistance = in2mm(xEdgeProbeDistance);
        xEdgeRetractDistance = in2mm(xEdgeRetractDistance);
        yEdgeProbeDistance = in2mm(yEdgeProbeDistance);
        yEdgeRetractDistance = in2mm(yEdgeRetractDistance);
        savedStartPoint = { x: in2mm(startPoint.x), y: in2mm(startPoint.y) };
        savedEndPoint = { x: in2mm(endPoint.x), y: in2mm(endPoint.y) };
        savedXEdgeStartPoint = { x: in2mm(xEdgeStartPoint.x), y: in2mm(xEdgeStartPoint.y) };
        savedXEdgeEndPoint = { x: in2mm(xEdgeEndPoint.x), y: in2mm(xEdgeEndPoint.y) };
        savedYEdgeStartPoint = { x: in2mm(yEdgeStartPoint.x), y: in2mm(yEdgeStartPoint.y) };
        savedYEdgeEndPoint = { x: in2mm(yEdgeEndPoint.x), y: in2mm(yEdgeEndPoint.y) };
      }
      this.config.set('probeDistance', Number(probeDistance));
      this.config.set('probeFeedrate', Number(probeFeedrate));
      this.config.set('slowProbeFeedrate', Number(slowProbeFeedrate));
      this.config.set('backoffDistance', Number(backoffDistance));
      this.config.set('retractDistance', Number(retractDistance));
      this.config.set('probeTipDiameter', Number(probeTipDiameter));
      this.config.set('zLift', Number(zLift));
      this.config.set('startPoint', savedStartPoint);
      this.config.set('endPoint', savedEndPoint);
      this.config.set('xEdgeProbeDistance', Number(xEdgeProbeDistance));
      this.config.set('xEdgeRetractDistance', Number(xEdgeRetractDistance));
      this.config.set('yEdgeProbeDistance', Number(yEdgeProbeDistance));
      this.config.set('yEdgeRetractDistance', Number(yEdgeRetractDistance));
      this.config.set('xEdgeStartPoint', savedXEdgeStartPoint);
      this.config.set('xEdgeEndPoint', savedXEdgeEndPoint);
      this.config.set('yEdgeStartPoint', savedYEdgeStartPoint);
      this.config.set('yEdgeEndPoint', savedYEdgeEndPoint);

      // settleDelay is a duration (seconds), not a length -- not subject
      // to the mm/in conversion above.
      this.config.set('settleDelay', Number(this.state.settleDelay));
    }

    getInitialState() {
      const savedStartPoint = this.config.get('startPoint', { x: 0, y: 0 });
      const savedEndPoint = this.config.get('endPoint', { x: 0, y: 100 });
      const savedXEdgeStartPoint = this.config.get('xEdgeStartPoint', { x: 0, y: 0 });
      const savedXEdgeEndPoint = this.config.get('xEdgeEndPoint', { x: 0, y: 50 });
      const savedYEdgeStartPoint = this.config.get('yEdgeStartPoint', { x: 0, y: 0 });
      const savedYEdgeEndPoint = this.config.get('yEdgeEndPoint', { x: 50, y: 0 });

      return {
        minimized: this.config.get('minimized', false),
        isFullscreen: false,
        port: controller.port,
        units: METRIC_UNITS,
        controller: {
          type: controller.type,
          state: controller.state
        },
        workflow: {
          state: controller.workflow.state
        },
        machinePosition: { x: 0, y: 0, z: 0 },
        workPosition: { x: 0, y: 0, z: 0 },
        probeTriggered: false,
        probeType: this.config.get('probeType', 'edge'),
        direction: this.config.get('direction', 'x+'),
        startPoint: {
          x: mapValueToUnits(savedStartPoint.x, METRIC_UNITS),
          y: mapValueToUnits(savedStartPoint.y, METRIC_UNITS),
        },
        endPoint: {
          x: mapValueToUnits(savedEndPoint.x, METRIC_UNITS),
          y: mapValueToUnits(savedEndPoint.y, METRIC_UNITS),
        },
        pointCount: this.config.get('pointCount', 3),
        probeDistance: Number(this.config.get('probeDistance') || 10),
        probeFeedrate: Number(this.config.get('probeFeedrate') || 100),
        slowProbeFeedrate: Number(this.config.get('slowProbeFeedrate') || 10),
        backoffDistance: Number(this.config.get('backoffDistance') || 2),
        settleDelay: Number(this.config.get('settleDelay') ?? 0.3),
        zLift: Number(this.config.get('zLift') ?? 5),
        retractDistance: Number(this.config.get('retractDistance') || 2),
        probeTipDiameter: Number(this.config.get('probeTipDiameter') || 0),
        xEdgeDirection: this.config.get('xEdgeDirection', 'x+'),
        xEdgeStartPoint: {
          x: mapValueToUnits(savedXEdgeStartPoint.x, METRIC_UNITS),
          y: mapValueToUnits(savedXEdgeStartPoint.y, METRIC_UNITS),
        },
        xEdgeEndPoint: {
          x: mapValueToUnits(savedXEdgeEndPoint.x, METRIC_UNITS),
          y: mapValueToUnits(savedXEdgeEndPoint.y, METRIC_UNITS),
        },
        xEdgePointCount: this.config.get('xEdgePointCount', 2),
        xEdgeProbeDistance: Number(this.config.get('xEdgeProbeDistance') || 10),
        xEdgeRetractDistance: Number(this.config.get('xEdgeRetractDistance') || 2),
        yEdgeDirection: this.config.get('yEdgeDirection', 'y+'),
        yEdgeStartPoint: {
          x: mapValueToUnits(savedYEdgeStartPoint.x, METRIC_UNITS),
          y: mapValueToUnits(savedYEdgeStartPoint.y, METRIC_UNITS),
        },
        yEdgeEndPoint: {
          x: mapValueToUnits(savedYEdgeEndPoint.x, METRIC_UNITS),
          y: mapValueToUnits(savedYEdgeEndPoint.y, METRIC_UNITS),
        },
        yEdgePointCount: this.config.get('yEdgePointCount', 2),
        yEdgeProbeDistance: Number(this.config.get('yEdgeProbeDistance') || 10),
        yEdgeRetractDistance: Number(this.config.get('yEdgeRetractDistance') || 2),
        toolProbeLength: 0,
        toolProbeMaxTravel: 0,
        toolProbeMaxStylusDeflection: 0,
        // grblHAL's $12x acceleration values, needed to estimate how far the
        // machine overtravels past contact (see estimateOvertravel).
        controllerSettings: controller.settings,
        isProbing: false,
        phase: null,
        touchLog: [],
        retryInfo: null,
        error: null,
        progress: { current: 0, total: 0 },
        result: null,
      };
    }

    addControllerEvents() {
      Object.keys(this.controllerEvents).forEach(eventName => {
        const callback = this.controllerEvents[eventName];
        controller.addListener(eventName, callback);
      });
    }

    removeControllerEvents() {
      Object.keys(this.controllerEvents).forEach(eventName => {
        const callback = this.controllerEvents[eventName];
        controller.removeListener(eventName, callback);
      });
    }

    canClick() {
      const { port, workflow, controller: controllerState } = this.state;
      const type = controllerState.type;
      const state = controllerState.state;

      if (!port) {
        return false;
      }
      if (workflow.state !== WORKFLOW_STATE_IDLE) {
        return false;
      }
      if (type !== GRBL) {
        return false;
      }
      const activeState = get(state, 'status.activeState');
      if (!includes([GRBL_ACTIVE_STATE_IDLE], activeState)) {
        return false;
      }

      return true;
    }

    exceedsMaxTravel() {
      const { probeDistance, toolProbeMaxTravel } = this.state;
      if (!toolProbeMaxTravel) {
        return false;
      }
      return Math.abs(probeDistance) > toolProbeMaxTravel;
    }

    exceedsCornerMaxTravel() {
      const { xEdgeProbeDistance, yEdgeProbeDistance, toolProbeMaxTravel } = this.state;
      if (!toolProbeMaxTravel) {
        return false;
      }
      return (
        Math.abs(xEdgeProbeDistance) > toolProbeMaxTravel ||
        Math.abs(yEdgeProbeDistance) > toolProbeMaxTravel
      );
    }

    // Axis acceleration in mm/s^2 from grblHAL's $120/$121/$122. Returns null
    // when settings haven't arrived yet (not connected, or still handshaking)
    // rather than guessing -- callers skip the estimate instead of showing a
    // number derived from a made-up acceleration.
    getAxisAcceleration(axis) {
      const key = { x: '$120', y: '$121', z: '$122' }[axis];
      const raw = get(this.state.controllerSettings, ['settings', key]);
      const accel = Number(raw);
      return (Number.isFinite(accel) && accel > 0) ? accel : null;
    }

    // How far the machine keeps moving after G38.2 trips, which is exactly
    // what the stylus has to absorb as deflection. It's a deceleration-limited
    // stop from the probing feed: d = v^2 / (2a), with v converted mm/min ->
    // mm/s. Deliberately ignores controller/probe-input latency, so this is a
    // floor on real overtravel, not a worst case.
    estimateOvertravel(axis, feedMmPerMin) {
      const accel = this.getAxisAcceleration(axis);
      const feed = Number(feedMmPerMin);
      if (accel === null || !Number.isFinite(feed) || feed <= 0) {
        return null;
      }
      const v = feed / 60;
      return (v * v) / (2 * accel);
    }

    // Worst-case overtravel across the axes this cycle will probe, using the
    // fast feed (the slow confirm touch is always gentler).
    worstCaseOvertravel() {
      const { probeType, probeFeedrate, direction } = this.state;
      const axes = (probeType === 'corner')
        ? ['x', 'y']
        : [String(direction || 'x').charAt(0)];
      const estimates = axes
        .map((axis) => this.estimateOvertravel(axis, probeFeedrate))
        .filter((d) => d !== null);
      return estimates.length ? Math.max(...estimates) : null;
    }

    // Blocks a run whose stop distance would compress the stylus past its
    // rated travel. Unknown acceleration or an unset limit means no opinion.
    exceedsStylusDeflection() {
      const { toolProbeMaxStylusDeflection } = this.state;
      if (!toolProbeMaxStylusDeflection) {
        return false;
      }
      const overtravel = this.worstCaseOvertravel();
      if (overtravel === null) {
        return false;
      }
      return overtravel > toolProbeMaxStylusDeflection;
    }

    render() {
      const { widgetId } = this.props;
      const { minimized, isFullscreen, probeType } = this.state;
      const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
      const exceedsMaxTravel = (probeType === 'corner') ? this.exceedsCornerMaxTravel() : this.exceedsMaxTravel();
      const exceedsStylusDeflection = this.exceedsStylusDeflection();
      const state = {
        ...this.state,
        canClick: this.canClick() && !exceedsMaxTravel && !exceedsStylusDeflection,
        canGetPosition: this.canClick(),
        exceedsMaxTravel: this.exceedsMaxTravel(),
        exceedsCornerMaxTravel: this.exceedsCornerMaxTravel(),
        exceedsStylusDeflection,
        estimatedOvertravel: this.worstCaseOvertravel(),
      };
      const actions = {
        ...this.actions
      };

      return (
        <Widget aria-label="Probing Cycles widget" fullscreen={isFullscreen}>
          <Widget.Header>
            <Widget.Title>
              <Widget.Sortable className={this.props.sortable.handleClassName}>
                <i aria-hidden="true" className="fa fa-bars" />
                <Space width="8" />
              </Widget.Sortable>
              {isForkedWidget &&
                <i aria-hidden="true" className="fa fa-code-fork" style={{ marginRight: 5 }} />}
              {i18n._('Probing Cycles')}
            </Widget.Title>
            <Widget.Controls className={this.props.sortable.filterClassName}>
              <Widget.Button
                aria-label={minimized ? 'Expand' : 'Collapse'}
                aria-expanded={!minimized}
                disabled={isFullscreen}
                title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                onClick={actions.toggleMinimized}
              >
                <i
                  aria-hidden="true"
                  className={classNames(
                    'fa',
                    { 'fa-chevron-up': !minimized },
                    { 'fa-chevron-down': minimized }
                  )}
                />
              </Widget.Button>
              <Widget.DropdownButton
                aria-label="More options"
                title={i18n._('More')}
                toggle={<i aria-hidden="true" className="fa fa-ellipsis-v" />}
                onSelect={(eventKey) => {
                  if (eventKey === 'fullscreen') {
                    actions.toggleFullscreen();
                  } else if (eventKey === 'fork') {
                    this.props.onFork();
                  } else if (eventKey === 'remove') {
                    this.props.onRemove();
                  }
                }}
              >
                <Widget.DropdownMenuItem eventKey="fullscreen">
                  <i
                    aria-hidden="true"
                    className={classNames(
                      'fa',
                      'fa-fw',
                      { 'fa-expand': !isFullscreen },
                      { 'fa-compress': isFullscreen }
                    )}
                  />
                  <Space width="4" />
                  {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                </Widget.DropdownMenuItem>
                <Widget.DropdownMenuItem eventKey="fork">
                  <i aria-hidden="true" className="fa fa-fw fa-code-fork" />
                  <Space width="4" />
                  {i18n._('Fork Widget')}
                </Widget.DropdownMenuItem>
                <Widget.DropdownMenuItem eventKey="remove">
                  <i aria-hidden="true" className="fa fa-fw fa-times" />
                  <Space width="4" />
                  {i18n._('Remove Widget')}
                </Widget.DropdownMenuItem>
              </Widget.DropdownButton>
            </Widget.Controls>
          </Widget.Header>
          <Widget.Content
            aria-hidden={minimized}
            className={classNames(
              styles['widget-content'],
              { [styles.hidden]: minimized }
            )}
          >
            <div className="btn-group btn-group-sm" style={{ display: 'flex', marginBottom: 10 }}>
              {PROBE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  className={
                    'btn btn-default' + (probeType === t.value ? ' btn-select' : '')
                  }
                  style={{ flex: 1 }}
                  disabled={state.isProbing}
                  onClick={() => actions.setProbeType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {probeType === 'corner' ? (
              <CornerProbe
                state={state}
                actions={actions}
              />
            ) : (
              <EdgeSkewProbe
                state={state}
                actions={actions}
              />
            )}
          </Widget.Content>
        </Widget>
      );
    }
}

export default ProbingCyclesWidget;
