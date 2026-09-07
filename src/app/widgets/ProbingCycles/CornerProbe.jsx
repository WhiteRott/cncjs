import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from 'app/components/Buttons';
import Image from 'app/components/Image';
import i18n from 'app/lib/i18n';
import { mapValueToUnits } from 'app/lib/units';
import iconPin from './images/pin.svg';

class CornerProbe extends PureComponent {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    renderPointFields = (label, point, setPoint) => {
      const { state } = this.props;
      const { canGetPosition, units, isProbing } = state;
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
                    disabled={isProbing}
                    value={point[axis]}
                    onChange={(event) => {
                      setPoint({ ...point, [axis]: Number(event.target.value) || 0 });
                    }}
                  />
                  <div className="input-group-addon">{displayUnits}</div>
                </div>
                <button
                  type="button"
                  disabled={!canGetPosition || isProbing}
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

    renderEdge = (edgePrefix, axisLabel, directions) => {
      const { state, actions } = this.props;
      const {
        units,
        isProbing,
      } = state;
      const direction = state[`${edgePrefix}Direction`];
      const startPoint = state[`${edgePrefix}StartPoint`];
      const endPoint = state[`${edgePrefix}EndPoint`];
      const pointCount = state[`${edgePrefix}PointCount`];
      const probeDistance = state[`${edgePrefix}ProbeDistance`];
      const retractDistance = state[`${edgePrefix}RetractDistance`];
      const displayUnits = (units === 'in') ? i18n._('in') : i18n._('mm');
      const step = (units === 'in') ? (1 / 16) : 1;

      return (
        <div style={{ border: '1px solid #ddd', borderRadius: 4, padding: 10, marginBottom: 12 }}>
          <label className="control-label">{i18n._('{{axis}} Edge', { axis: axisLabel })}</label>

          <div className="form-group">
            <div className="btn-group btn-group-sm" style={{ display: 'flex' }}>
              {directions.map(d => (
                <button
                  key={d.value}
                  type="button"
                  className={
                    'btn btn-default' + (direction === d.value ? ' btn-select' : '')
                  }
                  style={{ flex: 1 }}
                  disabled={isProbing}
                  onClick={() => actions.setEdgeField(edgePrefix, 'Direction', d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {this.renderPointFields(i18n._('Start Point'), startPoint, (point) => actions.setEdgeField(edgePrefix, 'StartPoint', point))}
          {this.renderPointFields(i18n._('End Point'), endPoint, (point) => actions.setEdgeField(edgePrefix, 'EndPoint', point))}

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
                    actions.setEdgeField(edgePrefix, 'PointCount', value);
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
                    onChange={(event) => actions.setEdgeField(edgePrefix, 'ProbeDistance', Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="control-label">{i18n._('Retract Distance')}</label>
            <div className="input-group input-group-sm">
              <input
                type="number"
                className="form-control"
                min={0}
                step={step}
                disabled={isProbing}
                value={retractDistance}
                onChange={(event) => actions.setEdgeField(edgePrefix, 'RetractDistance', Number(event.target.value) || 0)}
              />
              <span className="input-group-addon">{displayUnits}</span>
            </div>
          </div>
        </div>
      );
    };

    render() {
      const { state, actions } = this.props;
      const {
        canClick,
        units,
        probeFeedrate,
        slowProbeFeedrate,
        backoffDistance,
        settleDelay,
        zLift,
        probeTipDiameter,
        toolProbeLength,
        toolProbeMaxDeflection,
        exceedsCornerMaxDeflection,
        isProbing,
        phase,
        touchLog,
        retryInfo,
        error,
        progress,
        result,
      } = state;
      const displayUnits = (units === 'in') ? i18n._('in') : i18n._('mm');
      const feedrateUnits = (units === 'in') ? i18n._('in/min') : i18n._('mm/min');
      const step = (units === 'in') ? (1 / 16) : 1;

      return (
        <div>
          <p style={{ marginTop: 0 }}>
            <i>{i18n._('Probes two edges (2+ points each) and intersects the fitted lines to find the corner -- doesn\'t assume a perfect 90°.')}</i>
          </p>

          {this.renderEdge('xEdge', 'X', [
            { value: 'x+', label: '+X' },
            { value: 'x-', label: '-X' },
          ])}
          {this.renderEdge('yEdge', 'Y', [
            { value: 'y+', label: '+Y' },
            { value: 'y-', label: '-Y' },
          ])}

          {toolProbeLength > 0 && (
            <div className="alert alert-info" style={{ padding: '6px 10px', marginBottom: 12 }}>
              {i18n._('Your probe stylus extends {{length}}{{units}} below the tool tip. Account for this reduced clearance when jogging to the start position.', {
                length: mapValueToUnits(toolProbeLength, units).toFixed(3),
                units: displayUnits,
              })}
            </div>
          )}

          {exceedsCornerMaxDeflection && (
            <div className="alert alert-warning" style={{ padding: '6px 10px', marginBottom: 12 }}>
              {i18n._('A Probe Distance exceeds the configured Max Probe Deflection ({{max}}{{units}}). Reduce it or raise the limit in the Tool widget before running.', {
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

          <div className="row no-gutters">
            <div className="col-xs-6" style={{ paddingRight: 5 }}>
              <div className="form-group">
                <label className="control-label">{i18n._('Z Lift')}</label>
                <div className="input-group input-group-sm">
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    step={step}
                    disabled={isProbing}
                    value={zLift}
                    onChange={(event) => actions.setZLift(Number(event.target.value) || 0)}
                  />
                  <span className="input-group-addon">{displayUnits}</span>
                </div>
              </div>
            </div>
          </div>
          <p style={{ marginTop: -4, marginBottom: 12 }}>
            <i>{i18n._('How far to retract in Z before crossing from the X-edge to the Y-edge, and how far to plunge back down before probing resumes. This is the only point-to-point move that travels a real, unpredictable distance across your part — set it tall enough to clear the stock. Leave at 0 to disable (not recommended unless you\'ve verified the path is clear).')}</i>
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
          </div>

          <div style={{ display: 'flex', columnGap: 8, marginBottom: 12 }}>
            <Button
              btnStyle="primary"
              disabled={!canClick || isProbing}
              onClick={actions.startCornerProbe}
            >
              <i className="fa fa-play" />
              {' '}
              {i18n._('Run')}
            </Button>
            <Button
              disabled={!isProbing}
              onClick={actions.stopCornerProbe}
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
                {phase === 'retrying' && retryInfo && i18n._('Point {{current}} of {{total}}: touch missed, retrying (attempt {{attempt}}, search +{{extension}}{{units}})...', {
                  current: progress.current + 1,
                  total: progress.total,
                  attempt: retryInfo.attempt,
                  extension: mapValueToUnits(retryInfo.extension, units).toFixed(1),
                  units: displayUnits,
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
              {result.result ? (
                <div>
                  {i18n._('Corner: X{{x}} Y{{y}}', {
                    x: mapValueToUnits(result.result.x, units).toFixed(3),
                    y: mapValueToUnits(result.result.y, units).toFixed(3),
                  })}
                </div>
              ) : (
                <div className="text-warning">
                  {i18n._('Could not compute an intersection -- the two edges may be parallel. Check the direction settings.')}
                </div>
              )}
              <table className="table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>{i18n._('Edge')}</th>
                    <th>{i18n._('#')}</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Z</th>
                  </tr>
                </thead>
                <tbody>
                  {result.positions.map((p, index) => (
                    <tr key={index}>
                      <td>{p.edge}</td>
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

export default CornerProbe;
