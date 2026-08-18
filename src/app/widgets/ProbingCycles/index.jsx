import get from 'lodash/get';
import includes from 'lodash/includes';
import find from 'lodash/find';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import i18n from 'app/lib/i18n';
import { in2mm, mapValueToUnits } from 'app/lib/units';
import WidgetConfig from '../WidgetConfig';
import EdgeSkewProbe from './EdgeSkewProbe';
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
import { PROBE_DIRECTIONS } from './constants';
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
      setDirection: (value) => {
        this.setState({ direction: value });
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
      setProbeFeedrate: (value) => {
        this.setState({ probeFeedrate: value });
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
          retractDistance,
        } = this.state;
        const dir = find(PROBE_DIRECTIONS, { value: direction });
        if (!dir) {
          return;
        }

        this.setState({
          isProbing: true,
          progress: { current: 0, total: pointCount },
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
          retractDistance: -dir.sign * retractDistance,
        });
      },
      stopProbe: () => {
        controller.command('edgeprobe:stop');
        this.setState({ isProbing: false });
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
      'controller:state': (type, state) => {
        let units = this.state.units;

        if (type === GRBL) {
          const { status, parserstate } = { ...state };
          const { mpos, wpos } = { ...status };
          const { modal = {} } = { ...parserstate };
          units = {
            'G20': IMPERIAL_UNITS,
            'G21': METRIC_UNITS
          }[modal.units] || units;

          this.setState({
            machinePosition: { ...this.state.machinePosition, ...mpos },
            workPosition: { ...this.state.workPosition, ...wpos },
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
      'edgeprobe:update': (data) => {
        const { current, total } = data;
        this.setState({
          progress: { current, total },
        });
      },
      'edgeprobe:complete': (data) => {
        this.setState({
          isProbing: false,
          result: data,
        });
      },
    };

    unitsDidChange = false;

    componentDidMount() {
      this.addControllerEvents();
    }

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
        direction,
        startPoint,
        endPoint,
        pointCount,
      } = this.state;
      this.config.set('direction', direction);
      this.config.set('pointCount', pointCount);

      let { probeDistance, probeFeedrate, retractDistance } = this.state;
      let savedStartPoint = startPoint;
      let savedEndPoint = endPoint;
      if (units === IMPERIAL_UNITS) {
        probeDistance = in2mm(probeDistance);
        probeFeedrate = in2mm(probeFeedrate);
        retractDistance = in2mm(retractDistance);
        savedStartPoint = { x: in2mm(startPoint.x), y: in2mm(startPoint.y) };
        savedEndPoint = { x: in2mm(endPoint.x), y: in2mm(endPoint.y) };
      }
      this.config.set('probeDistance', Number(probeDistance));
      this.config.set('probeFeedrate', Number(probeFeedrate));
      this.config.set('retractDistance', Number(retractDistance));
      this.config.set('startPoint', savedStartPoint);
      this.config.set('endPoint', savedEndPoint);
    }

    getInitialState() {
      const savedStartPoint = this.config.get('startPoint', { x: 0, y: 0 });
      const savedEndPoint = this.config.get('endPoint', { x: 0, y: 100 });

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
        probeFeedrate: Number(this.config.get('probeFeedrate') || 50),
        retractDistance: Number(this.config.get('retractDistance') || 2),
        isProbing: false,
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

    render() {
      const { widgetId } = this.props;
      const { minimized, isFullscreen } = this.state;
      const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
      const state = {
        ...this.state,
        canClick: this.canClick(),
        canGetPosition: this.canClick(),
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
            <EdgeSkewProbe
              state={state}
              actions={actions}
            />
          </Widget.Content>
        </Widget>
      );
    }
}

export default ProbingCyclesWidget;
