import { ensureArray } from 'ensure-type';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from 'app/components/Buttons';
import i18n from 'app/lib/i18n';
import styles from './index.styl';

class ToolLibrary extends PureComponent {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    handleEditTool = (tool) => (event) => {
      const { actions } = this.props;
      actions.openEditToolModal(tool.id);
    };

    handleSetActiveTool = (tool) => (event) => {
      const { actions } = this.props;
      actions.setActiveTool(tool.id);
    };

    render() {
      const { state } = this.props;
      const { tools = [] } = state;

      return (
        <div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '1%' }} />
                  <th>{i18n._('#')}</th>
                  <th>{i18n._('Name')}</th>
                  <th>{i18n._('Diameter')}</th>
                  <th style={{ width: '1%' }} />
                </tr>
              </thead>
              <tbody>
                {tools.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      <div className={styles.emptyResult}>
                        {i18n._('No tools')}
                      </div>
                    </td>
                  </tr>
                )}
                {ensureArray(tools).map((tool) => (
                  <tr key={tool.id}>
                    <td style={{ width: '1%' }}>
                      <Button
                        aria-label={tool.active ? `${tool.name} is the active tool` : `Set active tool: ${tool.name}`}
                        compact
                        btnSize="xs"
                        btnStyle="flat"
                        disabled={tool.active}
                        onClick={this.handleSetActiveTool(tool)}
                        title={tool.active ? i18n._('Active Tool') : i18n._('Set as Active Tool')}
                      >
                        <i
                          aria-hidden="true"
                          className={tool.active ? 'fa fa-check-circle' : 'fa fa-circle-o'}
                          style={tool.active ? { color: '#5cb85c' } : undefined}
                        />
                      </Button>
                    </td>
                    <td>{tool.number}</td>
                    <td>{tool.name}</td>
                    <td>{tool.diameter}</td>
                    <td style={{ width: '1%' }}>
                      <div className="nowrap">
                        <Button
                          aria-label={`Edit tool: ${tool.name}`}
                          compact
                          btnSize="xs"
                          btnStyle="flat"
                          onClick={this.handleEditTool(tool)}
                        >
                          <i aria-hidden="true" className="fa fa-edit" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
}

export default ToolLibrary;
