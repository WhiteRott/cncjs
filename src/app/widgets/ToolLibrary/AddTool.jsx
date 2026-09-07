import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Button } from 'app/components/Buttons';
import Modal from 'app/components/Modal';
import { Form, Input, Select, Textarea } from 'app/components/Validation';
import { TOOL_SHAPES } from 'app/constants';
import i18n from 'app/lib/i18n';
import * as validations from 'app/lib/validations';

class AddTool extends PureComponent {
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

      return (
        <Modal disableOverlay size="md" onClose={actions.closeModal}>
          <Modal.Header>
            <Modal.Title>
              {i18n._('New Tool')}
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
                      value="0"
                    />
                  </div>
                </div>
                <div className="col-xs-6" style={{ paddingLeft: 5 }}>
                  <div className="form-group">
                    <label>{i18n._('Type')}</label>
                    <Select
                      ref={c => {
                        this.fields.type = c;
                      }}
                      className="form-control"
                      name="type"
                      value={TOOL_SHAPES[0].value}
                    >
                      {TOOL_SHAPES.map(shape => (
                        <option key={shape.value} value={shape.value}>
                          {i18n._(shape.label)}
                        </option>
                      ))}
                    </Select>
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
                  value=""
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
                      value="0"
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
                      value="0"
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
                      value="0"
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
                      value="0"
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
                  value=""
                />
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button
              onClick={actions.closeModal}
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

                  actions.addTool(this.value);
                  actions.closeModal();
                });
              }}
            >
              {i18n._('OK')}
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }
}

export default AddTool;
