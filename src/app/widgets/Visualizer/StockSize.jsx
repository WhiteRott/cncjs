import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Modal from 'app/components/Modal';
import { Form, Input } from 'app/components/Validation';
import i18n from 'app/lib/i18n';

class StockSize extends PureComponent {
    static propTypes = {
      state: PropTypes.object,
      actions: PropTypes.object
    };

    fields = {
      width: null,
      length: null,
      thickness: null
    };

    get value() {
      const { width, length, thickness } = this.form.getValues();
      return { width, length, thickness };
    }

    render() {
      const { state, actions } = this.props;
      const { width, length, thickness } = state.objects.stock;

      return (
        <Modal disableOverlay size="sm" onClose={actions.closeModal}>
          <Modal.Header>
            <Modal.Title>{i18n._('Stock Size')}</Modal.Title>
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
              <div className="form-group">
                <label>{i18n._('Width (X, mm)')}</label>
                <Input
                  ref={c => {
                    this.fields.width = c;
                  }}
                  type="number"
                  className="form-control"
                  name="width"
                  value={width}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label>{i18n._('Length (Y, mm)')}</label>
                <Input
                  ref={c => {
                    this.fields.length = c;
                  }}
                  type="number"
                  className="form-control"
                  name="length"
                  value={length}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label>{i18n._('Thickness (Z, mm)')}</label>
                <Input
                  ref={c => {
                    this.fields.thickness = c;
                  }}
                  type="number"
                  className="form-control"
                  name="thickness"
                  value={thickness}
                  min={0}
                />
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="btn btn-default"
              onClick={actions.closeModal}
            >
              {i18n._('Cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                actions.setStockSize(this.value);
                actions.closeModal();
              }}
            >
              {i18n._('OK')}
            </button>
          </Modal.Footer>
        </Modal>
      );
    }
}

export default StockSize;
