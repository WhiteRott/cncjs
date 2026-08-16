import chainedFunction from 'chained-function';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from 'app/components/Buttons';
import Modal from 'app/components/Modal';
import { Form, Input, Textarea } from 'app/components/Validation';
import i18n from 'app/lib/i18n';
import portal from 'app/lib/portal';
import * as validations from 'app/lib/validations';

class EditTool extends PureComponent {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    fields = {
      number: null,
      name: null,
      type: null,
      diameter: null,
      fluteLength: null,
      length: null,
      flutes: null,
      notes: null
    };

    get value() {
      const {
        number,
        name,
        type,
        diameter,
        fluteLength,
        length,
        flutes,
        notes
      } = this.form.getValues();

      return { number, name, type, diameter, fluteLength, length, flutes, notes };
    }

    render() {
      const { actions } = this.props;
      const {
        id,
        number,
        name,
        type,
        diameter,
        fluteLength,
        length,
        flutes,
        notes
      } = { ...this.props.state.modal.params };

      return (
        <Modal disableOverlay size="md" onClose={actions.closeModal}>
          <Modal.Header>
            <Modal.Title>
              {i18n._('Edit Tool')}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form
              ref={c => {
                this.form = c;
              }}
              onSubmit={(event) => {
                event.preventDefault();
              }}
            >
              <div className="row no-gutters">
                <div className="col-xs-6" style={{ paddingRight: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Tool Number')}</label>
                    <Input
                      ref={c => {
                        this.fields.number = c;
                      }}
                      type="number"
                      className="form-control"
                      name="number"
                      value={number}
                    />
                  </div>
                </div>
                <div className="col-xs-6" style={{ paddingLeft: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Type')}</label>
                    <Input
                      ref={c => {
                        this.fields.type = c;
                      }}
                      type="text"
                      className="form-control"
                      name="type"
                      value={type}
                      placeholder={i18n._('e.g. Endmill, Ball Nose, Drill')}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>{i18n._('Name')}</label>
                <Input
                  ref={c => {
                    this.fields.name = c;
                  }}
                  type="text"
                  className="form-control"
                  name="name"
                  value={name}
                  validations={[validations.required]}
                />
              </div>
              <div className="row no-gutters">
                <div className="col-xs-6" style={{ paddingRight: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Diameter (mm)')}</label>
                    <Input
                      ref={c => {
                        this.fields.diameter = c;
                      }}
                      type="number"
                      className="form-control"
                      name="diameter"
                      value={diameter}
                    />
                  </div>
                </div>
                <div className="col-xs-6" style={{ paddingLeft: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Flutes')}</label>
                    <Input
                      ref={c => {
                        this.fields.flutes = c;
                      }}
                      type="number"
                      className="form-control"
                      name="flutes"
                      value={flutes}
                    />
                  </div>
                </div>
              </div>
              <div className="row no-gutters">
                <div className="col-xs-6" style={{ paddingRight: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Flute Length (mm)')}</label>
                    <Input
                      ref={c => {
                        this.fields.fluteLength = c;
                      }}
                      type="number"
                      className="form-control"
                      name="fluteLength"
                      value={fluteLength}
                    />
                  </div>
                </div>
                <div className="col-xs-6" style={{ paddingLeft: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Overall Length (mm)')}</label>
                    <Input
                      ref={c => {
                        this.fields.length = c;
                      }}
                      type="number"
                      className="form-control"
                      name="length"
                      value={length}
                    />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>{i18n._('Notes')}</label>
                <Textarea
                  ref={c => {
                    this.fields.notes = c;
                  }}
                  rows="3"
                  className="form-control"
                  name="notes"
                  value={notes}
                />
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              btnStyle="danger"
              className="pull-left"
              onClick={() => {
                const toolName = get(this.fields.name, 'value');

                portal(({ onClose }) => (
                  <Modal disableOverlay={false} size="xs" onClose={onClose}>
                    <Modal.Header>
                      <Modal.Title>
                        {i18n._('Delete Tool')}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {i18n._('Are you sure you want to delete this tool?')}
                      <p><strong>{toolName}</strong></p>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button onClick={onClose}>
                        {i18n._('No')}
                      </Button>
                      <Button
                        btnStyle="danger"
                        onClick={chainedFunction(
                          () => {
                            actions.deleteTool(id);
                            actions.closeModal();
                          },
                          onClose
                        )}
                      >
                        {i18n._('Yes')}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                ));
              }}
            >
              {i18n._('Delete')}
            </Button>
            <Button
              onClick={() => {
                actions.closeModal();
              }}
            >
              {i18n._('Cancel')}
            </Button>
            <Button
              btnStyle="primary"
              onClick={() => {
                this.form.validate(err => {
                  if (err) {
                    return;
                  }

                  actions.updateTool(id, this.value);
                  actions.closeModal();
                });
              }}
            >
              {i18n._('Save Changes')}
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
}

export default EditTool;
