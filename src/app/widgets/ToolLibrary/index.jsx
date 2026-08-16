import classNames from 'classnames';
import find from 'lodash/find';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import api from 'app/api';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import i18n from 'app/lib/i18n';
import WidgetConfig from '../WidgetConfig';
import ToolLibrary from './ToolLibrary';
import AddTool from './AddTool';
import EditTool from './EditTool';
import {
  MODAL_NONE,
  MODAL_ADD_TOOL,
  MODAL_EDIT_TOOL
} from './constants';
import styles from './index.styl';

class ToolLibraryWidget extends PureComponent {
    static propTypes = {
      widgetId: PropTypes.string.isRequired,
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
      openModal: (name = MODAL_NONE, params = {}) => {
        this.setState({
          modal: {
            name: name,
            params: params
          }
        });
      },
      closeModal: () => {
        this.setState({
          modal: {
            name: MODAL_NONE,
            params: {}
          }
        });
      },
      updateModalParams: (params = {}) => {
        this.setState({
          modal: {
            ...this.state.modal,
            params: {
              ...this.state.modal.params,
              ...params
            }
          }
        });
      },
      addTool: async (tool) => {
        try {
          await api.toolLibrary.create(tool);
          await this.fetchTools();
        } catch (err) {
          // Ignore error
        }
      },
      deleteTool: async (id) => {
        try {
          await api.toolLibrary.delete(id);
          await this.fetchTools();
        } catch (err) {
          // Ignore error
        }
      },
      updateTool: async (id, tool) => {
        try {
          await api.toolLibrary.update(id, tool);
          await this.fetchTools();
        } catch (err) {
          // Ignore error
        }
      },
      openAddToolModal: () => {
        this.actions.openModal(MODAL_ADD_TOOL);
      },
      openEditToolModal: (id) => {
        const tool = find(this.state.tools, { id });
        if (tool) {
          this.actions.openModal(MODAL_EDIT_TOOL, { ...tool });
        }
      }
    };

    fetchTools = async () => {
      try {
        const res = await api.toolLibrary.fetch();
        const { records: tools } = res.body;
        this.setState({ tools: tools });
      } catch (err) {
        // Ignore error
      }
    };

    componentDidMount() {
      this.fetchTools();
    }

    componentDidUpdate(prevProps, prevState) {
      const {
        minimized
      } = this.state;

      this.config.set('minimized', minimized);
    }

    getInitialState() {
      return {
        minimized: this.config.get('minimized', false),
        isFullscreen: false,
        modal: {
          name: MODAL_NONE,
          params: {}
        },
        tools: []
      };
    }

    render() {
      const { minimized, isFullscreen } = this.state;
      const state = {
        ...this.state
      };
      const actions = {
        ...this.actions
      };

      return (
        <Widget aria-label="Tool Library widget" fullscreen={isFullscreen}>
          <Widget.Header>
            <Widget.Title>
              <Widget.Sortable className={this.props.sortable.handleClassName}>
                <i aria-hidden="true" className="fa fa-bars" />
                <Space width="8" />
              </Widget.Sortable>
              {i18n._('Tool Library')}
            </Widget.Title>
            <Widget.Controls className={this.props.sortable.filterClassName}>
              <Widget.Button
                aria-label="New tool"
                title={i18n._('New Tool')}
                onClick={actions.openAddToolModal}
              >
                <i aria-hidden="true" className="fa fa-plus" />
              </Widget.Button>
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
            {state.modal.name === MODAL_ADD_TOOL &&
              <AddTool state={state} actions={actions} />}
            {state.modal.name === MODAL_EDIT_TOOL &&
              <EditTool state={state} actions={actions} />}
            <ToolLibrary state={state} actions={actions} />
          </Widget.Content>
        </Widget>
      );
    }
}

export default ToolLibraryWidget;
