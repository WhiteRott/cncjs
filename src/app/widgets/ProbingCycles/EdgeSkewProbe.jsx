import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from 'app/components/Buttons';
import Image from 'app/components/Image';
import i18n from 'app/lib/i18n';
import { mapValueToUnits } from 'app/lib/units';
import iconPin from './images/pin.svg';
import { PROBE_DIRECTIONS } from './constants';

class EdgeSkewProbe extends PureComponent {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    renderPointFields = (label, point, setPoint) => {
      const { state } = this.props;
      const { canGetPosition, units } = state;
      const displayUnits = (units === 'in') ? i18n._('in') : i18n._('mm');
      const step = (units === 'in') ? (1 / 16) : 1;

      return (
        <div className="form-group">
          <label className="control-label">{label}</label>
          <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
            {['x', 'y'].map(axis => (
              <div key={axis} style={{ display: 'flex', columnGap: 8 }}>
                <div className="input-group input-group-sm">
                  <div className="input-group-addon">{axis.toUpperCase()}</div>
                  <input
                    type="number"
                    className="form-control"
                    step={step}
                    value={point[axis]}
                    onChange={(event) => {
                      setPoint({ ...point, [axis]: Number(event.target.value) || 0 });
                    }}
                  />
                  <div className="input-group-addon">{displayUnits}</div>
                </div>
                <button
                  type="button"
                  disabled={!canGetPosition}
                  onClick={() => {
                    const value = state.workPosition?.[axis];
                    if (value !== undefined) {
                      setPoint({ ...point, [axis]: Number(value) });
                    }
                  }}
                  className="btn btn-default"
                  style={{ padding: '4px 8px' }}
                  title={i18n._('Use the current work position for this axis.')}
                >
                  <Image src={iconPin} width="14" height="14" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    render() {
      const { state, actions } = this.props;
      const {
        canClick,
        units,
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
        toolProbeLength,
        toolProbeMaxDeflection,
        exceedsMaxDeflection,
        isProbing,
        phase,
        touchLog,
        error,
        progress,
        result,
        probeTriggered,
      } = state;
      const displayUnits = (units === 'in') ? i18n._('in') : i18n._('mm');
      const feedrateUnits = (units === 'in') ? i18n._('in/min') : i18n._('mm/min');
      const step = (units === 'in') ? (1 / 16) : 1;

      return (
        <div>
          <div
            className="form-group"
            style={{ display: 'flex', alignItems: 'center', columnGap: 8 }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: probeTriggered ? '#d9534f' : '#5cb85c',
                boxShadow: probeTriggered ? '0 0 4px #d9534f' : 'none',
              }}
            />
            <span>
              {probeTriggered
                ? i18n._('Probe: TOUCHING')
                : i18n._('Probe: clear')}
            </span>
          </div>

          <div className="form-group">
            <label className="control-label">{i18n._('Probe Direction')}</label>
            <div className="btn-group btn-group-sm" style={{ display: 'flex' }}>
              {PROBE_DIRECTIONS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  className={
                    'btn btn-default' + (direction === d.value ? ' btn-select' : '')
                  }
                  style={{ flex: 1 }}
                  disabled={isProbing}
                  onClick={() => actions.setDirection(d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p style={{ marginTop: 4 }}>
              <i>{i18n._('Which way the probe moves at each sample point. Points are spaced along the other axis.')}</i>
            </p>
          </div>

          {this.renderPointFields(i18n._('Start Point'), startPoint, actions.setStartPoint)}
          {this.renderPointFields(i18n._('End Point'), endPoint, actions.setEndPoint)}

          <div className="row no-gutters">
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Number of Points')}</label>
                <input
                  type="number"
                  className="form-control"
                  min={2}
                  step={1}
                  disabled={isProbing}
                  value={pointCount}
                  onChange={(event) => {
                    const value = Math.max(2, Number(event.target.value) || 2);
                    actions.setPointCount(value);
                  }}
                />
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Probe Distance')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={step}
                    disabled={isProbing}
                    value={probeDistance}
                    onChange={(event) => actions.setProbeDistance(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
          </div>

          {toolProbeLength > 0 && (
            <div className="alert alert-info" style={{ padding: '6px 10px', marginBottom: 12 }}>
              {i18n._('Your probe stylus extends {{length}}{{units}} below the tool tip. Account for this reduced clearance when jogging to the start position.', {
                length: mapValueToUnits(toolProbeLength, units).toFixed(3),
                units: displayUnits,
              })}
            </div>
          )}

          {exceedsMaxDeflection && (
            <div className="alert alert-warning" style={{ padding: '6px 10px', marginBottom: 12 }}>
              {i18n._('Probe Distance exceeds the configured Max Probe Deflection ({{max}}{{units}}). Reduce Probe Distance or raise the limit in the Tool widget before running.', {
                max: mapValueToUnits(toolProbeMaxDeflection, units).toFixed(3),
                units: displayUnits,
              })}
            </div>
          )}

          <div className="row no-gutters">
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Fast Probe Feedrate')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={step}
                    disabled={isProbing}
                    value={probeFeedrate}
                    onChange={(event) => actions.setProbeFeedrate(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{feedrateUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Slow Probe Feedrate')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={step}
                    disabled={isProbing}
                    value={slowProbeFeedrate}
                    onChange={(event) => actions.setSlowProbeFeedrate(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{feedrateUnits}</span>
                </div>
              </div>
            </div>
          </div>
          <p style={{ marginTop: -4, marginBottom: 12 }}>
            <i>{i18n._('Each point is touched twice: a fast approach to find the edge, then — after backing off — a slower touch to the same target for an accurate, repeatable reading. Only the slow touch is used for the result.')}</i>
          </p>

          <div className="row no-gutters">
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Back-off Distance')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={step}
                    disabled={isProbing}
                    value={backoffDistance}
                    onChange={(event) => actions.setBackoffDistance(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
            <div className="col-xs-6" style={{ paddingLeft: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Retract Distance')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={step}
                    disabled={isProbing}
                    value={retractDistance}
                    onChange={(event) => actions.setRetractDistance(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="row no-gutters">
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Settle Delay')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={0.1}
                    disabled={isProbing}
                    value={settleDelay}
                    onChange={(event) => actions.setSettleDelay(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{i18n._('s')}</span>
                </div>
              </div>
            </div>
          </div>
          <p style={{ marginTop: -4, marginBottom: 12 }}>
            <i>{i18n._('Pause after backing off, before the slow touch, to let vibration from the fast touch settle out.')}</i>
          </p>

          <div className="form-group">
            <label className="control-label">{i18n._('Probe Tip Diameter')}</label>
            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control"
                min={0}
                step={step}
                disabled={isProbing}
                value={probeTipDiameter}
                onChange={(event) => actions.setProbeTipDiameter(Number(event.target.value) || 0)}
              />
              <span className="input-group-addon">{displayUnits}</span>
            </div>
            <p style={{ marginTop: 4 }}>
              <i>{i18n._('Ball diameter of your touch probe stylus. Corrects the reported contact position for the offset between the ball surface and its center. Leave at 0 if you\'re probing with the cutting tool or a flat plate.')}</i>
            </p>
          </div>

          <div style={{ display: 'flex', columnGap: 8, marginBottom: 12 }}>
            <Button
              btnStyle="primary"
              disabled={!canClick || isProbing}
              onClick={actions.startProbe}
            >
              <i className="fa fa-play" />
              {' '}
              {i18n._('Run')}
            </Button>
            <Button
              disabled={!isProbing}
              onClick={actions.stopProbe}
            >
              <i className="fa fa-stop" />
              {' '}
              {i18n._('Stop')}
            </Button>
          </div>

          {isProbing && progress.total > 0 && (
            <div className="form-group">
              <i>
                {phase === 'moving' && i18n._('Point {{current}} of {{total}}: moving into position...', {
                  current: progress.current + 1,
                  total: progress.total,
                })}
                {phase === 'probing-fast' && i18n._('Point {{current}} of {{total}}: fast touch (finding the edge)...', {
                  current: progress.current + 1,
                  total: progress.total,
                })}
                {phase === 'probing-slow' && i18n._('Point {{current}} of {{total}}: slow touch (confirming)...', {
                  current: progress.current + 1,
                  total: progress.total,
                })}
                {!phase && i18n._('Probing point {{current}} of {{total}}...', {
                  current: progress.current,
                  total: progress.total,
                })}
              </i>
            </div>
          )}

          {isProbing && touchLog.length > 0 && (
            <div className="form-group">
              <label className="control-label">{i18n._('Touch Log')}</label>
              <table className="table" style={{ marginTop: 4 }}>
                <thead>
                  <tr>
                    <th>{i18n._('Point')}</th>
                    <th>{i18n._('Touch')}</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Z</th>
                  </tr>
                </thead>
                <tbody>
                  {touchLog.map((t, index) => (
                    <tr key={index}>
                      <td>{t.point + 1}</td>
                      <td>{(t.touch < t.touchesPerPoint) ? i18n._('fast') : i18n._('slow')}</td>
                      <td>{mapValueToUnits(t.pos.x, units).toFixed(3)}</td>
                      <td>{mapValueToUnits(t.pos.y, units).toFixed(3)}</td>
                      <td>{mapValueToUnits(t.pos.z, units).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isProbing && error && (
            <div className="alert alert-danger" style={{ padding: '6px 10px', marginBottom: 12 }}>
              {i18n._('Point {{point}} of {{total}} failed: the {{touch}} touch did not make contact within Probe Distance. Check positioning and re-run.', {
                point: error.point + 1,
                total: error.total,
                touch: (error.touch < 2) ? i18n._('fast') : i18n._('slow'),
              })}
            </div>
          )}

          {!isProbing && result && (
            <div className="form-group">
              <label className="control-label">{i18n._('Result')}</label>
              <div>
                {i18n._('Skew angle: {{angle}}°', { angle: result.fit.angleDeg.toFixed(4) })}
              </div>
              <div className={result.fit.angleDeg && Math.abs(result.fit.angleDeg) > 0.05
                ? 'text-warning'
                : 'text-success'}
              >
                {Math.abs(result.fit.angleDeg) > 0.05
                  ? i18n._('Edge is not aligned to the machine axis — consider re-clamping the stock.')
                  : i18n._('Edge is aligned to the machine axis.')}
              </div>
              <table className="table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>{i18n._('#')}</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Z</th>
                  </tr>
                </thead>
                <tbody>
                  {result.positions.map((p, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{mapValueToUnits(p.x, units).toFixed(3)}</td>
                      <td>{mapValueToUnits(p.y, units).toFixed(3)}</td>
                      <td>{mapValueToUnits(p.z, units).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }
}

export default EdgeSkewProbe;
