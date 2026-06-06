import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Typography,
  Steps,
  DatePicker,
  Select,
  Button,
  Space,
} from 'antd';
import { billingService, PromoCode } from '../../../services/billingService';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

const WIZARD_STEPS = [
  { title: 'Basic Info' },
  { title: 'Validity & Limits' },
  { title: 'Applicability' },
  { title: 'Review' },
];

/** All form field names — used on final save (step-3 has no inputs mounted). */
const ALL_PROMO_FORM_FIELDS = [
  'code',
  'description',
  'discount_type',
  'discount_value',
  'valid_from',
  'valid_until',
  'max_uses',
  'max_uses_per_user',
  'min_purchase_amount',
  'first_purchase_only',
  'applicable_plans',
  'applicable_packages',
  'is_active',
] as const;

export interface PromoCodeFormModalProps {
  open: boolean;
  editingCode: PromoCode | null;
  onClose: () => void;
  onSaved: () => void;
}

const PromoCodeFormModal: React.FC<PromoCodeFormModalProps> = ({
  open,
  editingCode,
  onClose,
  onSaved,
}) => {
  const [wizardStep, setWizardStep] = useState(0);
  const [form] = Form.useForm();

  const handleFullClose = useCallback(() => {
    setWizardStep(0);
    form.resetFields();
    onClose();
  }, [form, onClose]);

  useEffect(() => {
    if (!open) {
      setWizardStep(0);
      form.resetFields();
      return;
    }
    setWizardStep(0);
    if (editingCode) {
      form.setFieldsValue({
        ...editingCode,
        valid_from: editingCode.valid_from ? dayjs(editingCode.valid_from) : undefined,
        valid_until: editingCode.valid_until ? dayjs(editingCode.valid_until) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, editingCode, form]);

  const toIso = (v: unknown): string | undefined => {
    if (v == null) return undefined;
    if (dayjs.isDayjs(v)) return v.toISOString();
    if (typeof v === 'string' && v) return dayjs(v).toISOString();
    return undefined;
  };

  const handleSubmit = async () => {
    try {
      const allValues = form.getFieldsValue(true) as Record<string, unknown>;
      const submitData: Record<string, unknown> = {
        ...allValues,
        valid_from: toIso(allValues.valid_from),
        valid_until: toIso(allValues.valid_until),
      };

      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === undefined) {
          delete submitData[key];
        }
      });

      if (editingCode) {
        await billingService.updatePromoCode(editingCode.id, submitData);
        message.success('Promo code updated successfully');
      } else {
        await billingService.createPromoCode(submitData);
        message.success('Promo code created successfully');
      }
      handleFullClose();
      onSaved();
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err.message || 'Failed to save promo code');
    }
  };

  const validateStepFields = async (step: number) => {
    let fields: string[];
    if (step === 0) {
      fields = ['code', 'description', 'discount_type', 'discount_value'];
    } else if (step === 1) {
      fields = [
        'valid_from',
        'valid_until',
        'max_uses',
        'max_uses_per_user',
        'min_purchase_amount',
        'first_purchase_only',
      ];
    } else {
      fields = ['applicable_plans', 'applicable_packages'];
    }
    await form.validateFields(fields);
  };

  const goNext = async () => {
    try {
      await validateStepFields(wizardStep);
      setWizardStep((s) => s + 1);
    } catch {
      /* validation errors shown by Form */
    }
  };

  const goBack = () => {
    setWizardStep((s) => Math.max(0, s - 1));
  };

  const handlePrimaryClick = async () => {
    if (wizardStep < 3) {
      await goNext();
      return;
    }
    try {
      await form.validateFields([...ALL_PROMO_FORM_FIELDS]);
      await handleSubmit();
    } catch {
      /* validation */
    }
  };

  return (
    <Modal
      title={editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
      open={open}
      onCancel={handleFullClose}
      width={700}
      destroyOnHidden
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
          {wizardStep > 0 && <Button onClick={goBack}>Back</Button>}
          <Button onClick={handleFullClose}>Cancel</Button>
          <Button type="primary" onClick={handlePrimaryClick}>
            {wizardStep < 3 ? 'Next' : 'Save'}
          </Button>
        </Space>
      }
    >
      <Steps current={wizardStep} className="mb-6">
        {WIZARD_STEPS.map((step) => (
          <Steps.Step key={step.title} title={step.title} />
        ))}
      </Steps>

      <Form form={form} layout="vertical" preserve>
        {/* Keep steps mounted so values stay in the form store (unmounting clears them). */}
        <div style={{ display: wizardStep === 0 ? 'block' : 'none' }}>
          <Form.Item
            name="code"
            label="Promo Code"
            rules={[
              { required: true, message: 'Please enter promo code' },
              { pattern: /^[A-Z0-9]+$/, message: 'Only uppercase letters and numbers allowed' },
            ]}
          >
            <Input placeholder="SAVE20" className="font-mono" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Promo code description" />
          </Form.Item>

          <Form.Item
            name="discount_type"
            label="Discount Type"
            rules={[{ required: true, message: 'Please select discount type' }]}
          >
            <Select>
              <Select.Option value="percentage">Percentage</Select.Option>
              <Select.Option value="fixed_amount">Fixed Amount</Select.Option>
              <Select.Option value="free_credits">Free Credits</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="discount_value"
            label="Discount Value"
            rules={[{ required: true, message: 'Please enter discount value' }]}
          >
            <InputNumber min={0} className="w-full" placeholder="20" />
          </Form.Item>
        </div>

        <div style={{ display: wizardStep === 1 ? 'block' : 'none' }}>
          <Form.Item
            name="valid_from"
            label="Valid From"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            name="valid_until"
            label="Valid Until"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="max_uses" label="Max Uses (Total)">
            <InputNumber min={1} className="w-full" placeholder="Leave empty for unlimited" />
          </Form.Item>

          <Form.Item
            name="max_uses_per_user"
            label="Max Uses Per User"
            rules={[{ required: true, message: 'Please enter max uses per user' }]}
          >
            <InputNumber min={1} className="w-full" placeholder="1" />
          </Form.Item>

          <Form.Item name="min_purchase_amount" label="Minimum Purchase Amount">
            <InputNumber min={0} step={0.01} className="w-full" placeholder="0.00" />
          </Form.Item>

          <Form.Item name="first_purchase_only" valuePropName="checked" label="First Purchase Only">
            <Switch />
          </Form.Item>
        </div>

        <div style={{ display: wizardStep === 2 ? 'block' : 'none' }}>
          <Form.Item name="applicable_plans" label="Applicable Plans (Leave empty for all)">
            <Select mode="multiple" placeholder="Select plans" allowClear />
          </Form.Item>

          <Form.Item name="applicable_packages" label="Applicable Packages (Leave empty for all)">
            <Select mode="multiple" placeholder="Select packages" allowClear />
          </Form.Item>

          <Form.Item name="is_active" valuePropName="checked" initialValue={true} label="Active">
            <Switch />
          </Form.Item>
        </div>

        {wizardStep === 3 && (
          <div>
            <Text>Review your promo code settings before creating.</Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default PromoCodeFormModal;
