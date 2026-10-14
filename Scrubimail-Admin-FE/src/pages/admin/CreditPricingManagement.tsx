import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Calculator, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import creditPricingService, { AdminCreditPricing } from '../../services/creditPricingService';
import {
  CreditPricingRules,
  CreditPricingTier,
  creditsForAmount,
  formatMoney,
  formatUnitPrice,
  isQuoteProblem,
  quoteForCredits,
} from '../../utils/creditPricing';

const { Title, Text, Paragraph } = Typography;

type Draft = Pick<
  CreditPricingRules,
  'is_enabled' | 'currency' | 'tiers_mode' | 'tiers' | 'min_credits' | 'max_credits' | 'credit_step' | 'expiry_days'
>;

const toDraft = (c: AdminCreditPricing): Draft => ({
  is_enabled: c.is_enabled,
  currency: c.currency,
  tiers_mode: c.tiers_mode,
  tiers: c.tiers.map((t) => ({ from: t.from, unit_price: String(t.unit_price) })),
  min_credits: c.min_credits,
  max_credits: c.max_credits,
  credit_step: c.credit_step,
  expiry_days: c.expiry_days,
});

/** Same rules the server enforces (credit_pricing.parse_tiers / validate_rules). */
function draftProblems(d: Draft): string[] {
  const out: string[] = [];
  if (!d.tiers.length) out.push('Add at least one tier.');
  d.tiers.forEach((t, i) => {
    const price = Number(t.unit_price);
    if (!Number.isInteger(t.from) || t.from < 1) out.push(`Tier ${i + 1}: "from" must be a whole number ≥ 1.`);
    if (!(price > 0)) out.push(`Tier ${i + 1}: price must be greater than 0.`);
    if ((t.unit_price.split('.')[1] || '').length > 6) out.push(`Tier ${i + 1}: at most 6 decimal places.`);
    const prev = d.tiers[i - 1];
    if (prev && t.from <= prev.from) out.push(`Tier ${i + 1}: "from" must be higher than tier ${i}.`);
    if (prev && price > Number(prev.unit_price)) out.push(`Tier ${i + 1}: price can't be higher than tier ${i}.`);
  });
  if (d.credit_step < 1) out.push('Credit step must be at least 1.');
  if (d.min_credits < 1) out.push('Minimum credits must be at least 1.');
  if (d.max_credits <= d.min_credits) out.push('Maximum must be greater than minimum.');
  if (d.credit_step >= 1 && (d.min_credits % d.credit_step || d.max_credits % d.credit_step))
    out.push('Minimum and maximum must be multiples of the credit step.');
  if (d.tiers[0] && d.tiers[0].from > d.min_credits) out.push('The first tier must start at or below the minimum purchase.');
  return out;
}

const CreditPricingManagement: React.FC = () => {
  const [saved, setSaved] = useState<AdminCreditPricing | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testCredits, setTestCredits] = useState<number | null>(10000);
  const [testAmount, setTestAmount] = useState<number | null>(50);

  const load = async () => {
    setLoading(true);
    try {
      const data = await creditPricingService.get();
      setSaved(data);
      setDraft(toDraft(data));
    } catch (e: any) {
      message.error(e.message || 'Failed to load credit pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const problems = useMemo(() => (draft ? draftProblems(draft) : []), [draft]);
  const dirty = useMemo(
    () => !!saved && !!draft && JSON.stringify(toDraft(saved)) !== JSON.stringify(draft),
    [saved, draft]
  );
  // The live preview runs on the *draft*, so admins see the effect before saving.
  const rules: CreditPricingRules | null = draft && !problems.length ? draft : null;

  if (loading || !draft) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  const patch = (p: Partial<Draft>) => setDraft({ ...draft, ...p });
  const patchTier = (i: number, p: Partial<CreditPricingTier>) =>
    patch({ tiers: draft.tiers.map((t, j) => (j === i ? { ...t, ...p } : t)) });

  const addTier = () => {
    const last = draft.tiers[draft.tiers.length - 1];
    const from = last ? last.from * 2 : draft.min_credits;
    const price = last ? (Number(last.unit_price) * 0.85).toFixed(4) : '0.0100';
    patch({ tiers: [...draft.tiers, { from, unit_price: price }] });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await creditPricingService.update(draft);
      setSaved(data);
      setDraft(toDraft(data));
      message.success('Credit pricing saved — it applies to new checkouts immediately');
    } catch (e: any) {
      message.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const ccy = draft.currency;
  const baseUnit = Number(draft.tiers[0]?.unit_price || 0);

  const tierColumns: ColumnsType<CreditPricingTier & { index: number }> = [
    {
      title: 'From (credits)',
      key: 'from',
      render: (_, t) => (
        <InputNumber
          min={1}
          precision={0}
          value={t.from}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => Number((v || '').replace(/,/g, '')) as any}
          onChange={(v) => patchTier(t.index, { from: Number(v ?? 0) })}
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: `Price per credit (${ccy})`,
      key: 'unit_price',
      render: (_, t) => (
        <InputNumber
          min="0"
          step="0.0005"
          stringMode
          value={t.unit_price}
          onChange={(v) => patchTier(t.index, { unit_price: String(v ?? '') })}
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: 'Discount vs first tier',
      key: 'discount',
      render: (_, t) => {
        const pct = baseUnit ? (1 - Number(t.unit_price) / baseUnit) * 100 : 0;
        return pct > 0 ? <Tag color="green">−{pct.toFixed(1)}%</Tag> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Price at tier start',
      key: 'start_total',
      render: (_, t) => {
        if (!rules) return <Text type="secondary">—</Text>;
        const credits = Math.max(Math.ceil(t.from / rules.credit_step) * rules.credit_step, rules.min_credits);
        const q = quoteForCredits(rules, credits);
        return isQuoteProblem(q) ? (
          <Text type="secondary">—</Text>
        ) : (
          <Text>
            {credits.toLocaleString()} → {formatMoney(q.total, ccy)}
          </Text>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, t) => (
        <Button
          type="text"
          danger
          disabled={draft.tiers.length === 1}
          icon={<Trash2 size={16} />}
          onClick={() => patch({ tiers: draft.tiers.filter((_, j) => j !== t.index) })}
        />
      ),
    },
  ];

  const creditsQuote = rules && testCredits ? quoteForCredits(rules, testCredits) : null;
  const amountCredits = rules && testAmount ? creditsForAmount(rules, testAmount) : null;
  const amountQuote =
    rules && typeof amountCredits === 'number' ? quoteForCredits(rules, amountCredits) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Credit Pricing
          </Title>
          <Text type="secondary">
            Rules for pay-as-you-go purchases, where users enter the credits they need or an amount to spend.
            Checkout always re-prices on the server with these rules.
          </Text>
        </div>
        <Space>
          <Button icon={<RotateCcw size={16} />} disabled={!dirty || saving} onClick={() => saved && setDraft(toDraft(saved))}>
            Discard
          </Button>
          <Button
            type="primary"
            icon={<Save size={16} />}
            loading={saving}
            disabled={!dirty || problems.length > 0}
            onClick={handleSave}
          >
            Save changes
          </Button>
        </Space>
      </div>

      {saved?.config_error && (
        <Alert type="error" showIcon message="The saved configuration is invalid" description={saved.config_error} />
      )}
      {problems.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message="Fix these before saving"
          description={
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Rules">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space size="large" wrap>
                <Space>
                  <Switch checked={draft.is_enabled} onChange={(v) => patch({ is_enabled: v })} />
                  <Text>{draft.is_enabled ? 'Pay-as-you-go enabled' : 'Pay-as-you-go disabled (packages only)'}</Text>
                </Space>
                <Space>
                  <Text>Currency</Text>
                  <Select
                    value={draft.currency}
                    onChange={(v) => patch({ currency: v })}
                    options={[
                      { value: 'USD', label: 'USD' },
                      { value: 'GHS', label: 'GHS' },
                    ]}
                    style={{ width: 100 }}
                  />
                </Space>
              </Space>

              <div>
                <Text strong>Tier mode</Text>
                <Radio.Group
                  value={draft.tiers_mode}
                  onChange={(e) => patch({ tiers_mode: e.target.value })}
                  style={{ display: 'block', marginTop: 8 }}
                >
                  <Space direction="vertical">
                    <Radio value="volume">
                      <Text strong>Volume</Text> — the whole purchase gets the rate of the tier it reaches (industry
                      standard; rewards bigger purchases)
                    </Radio>
                    <Radio value="graduated">
                      <Text strong>Graduated</Text> — each band is priced at its own rate, then summed (no price
                      cliffs at tier boundaries)
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              <Row gutter={16}>
                {(
                  [
                    ['min_credits', 'Minimum purchase (credits)'],
                    ['max_credits', 'Maximum purchase (credits)'],
                    ['credit_step', 'Credit step'],
                  ] as const
                ).map(([key, label]) => (
                  <Col xs={24} sm={8} key={key}>
                    <Text type="secondary">{label}</Text>
                    <InputNumber
                      min={1}
                      precision={0}
                      value={draft[key]}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(v) => Number((v || '').replace(/,/g, '')) as any}
                      onChange={(v) => patch({ [key]: Number(v ?? 0) } as Partial<Draft>)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </Col>
                ))}
              </Row>

              <div>
                <Text type="secondary">Purchased credits expire after (days)</Text>
                <InputNumber
                  min={1}
                  precision={0}
                  placeholder="Never"
                  value={draft.expiry_days}
                  onChange={(v) => patch({ expiry_days: v ? Number(v) : null })}
                  style={{ width: '100%', marginTop: 4 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Leave empty for credits that never expire.
                </Text>
              </div>
            </Space>
          </Card>

          <Card
            title="Price tiers"
            style={{ marginTop: 16 }}
            extra={
              <Button icon={<Plus size={16} />} onClick={addTier}>
                Add tier
              </Button>
            }
          >
            <Paragraph type="secondary" style={{ marginTop: 0 }}>
              A tier applies from its "from" quantity until the next tier starts. Prices must stay the same or fall as
              volume grows.
            </Paragraph>
            <Table
              rowKey="index"
              size="small"
              pagination={false}
              columns={tierColumns}
              dataSource={draft.tiers.map((t, index) => ({ ...t, index }))}
              scroll={{ x: true }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            title={
              <Space>
                <Calculator size={18} /> Live preview
              </Space>
            }
            extra={dirty ? <Tag color="orange">Unsaved draft</Tag> : <Tag color="green">Live</Tag>}
          >
            {!rules ? (
              <Text type="secondary">Fix the rules to see a preview.</Text>
            ) : (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">A user asks for… (credits)</Text>
                  <InputNumber
                    min={1}
                    value={testCredits}
                    onChange={(v) => setTestCredits(v ? Number(v) : null)}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => Number((v || '').replace(/,/g, '')) as any}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                  {creditsQuote &&
                    (isQuoteProblem(creditsQuote) ? (
                      <Text type="danger">{creditsQuote.error}</Text>
                    ) : (
                      <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
                        <Descriptions.Item label="They pay">
                          <Text strong>{formatMoney(creditsQuote.total, ccy)}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Per credit">
                          {formatUnitPrice(creditsQuote.effectiveUnitPrice, ccy)} (tier {creditsQuote.tierIndex + 1})
                        </Descriptions.Item>
                        {creditsQuote.nextTier && (
                          <Descriptions.Item label="Upsell shown">
                            +{creditsQuote.nextTier.creditsNeeded.toLocaleString()} credits →{' '}
                            {formatUnitPrice(creditsQuote.nextTier.unitPrice, ccy)}/credit
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    ))}
                </div>
                <div>
                  <Text type="secondary">A user wants to spend… ({ccy})</Text>
                  <InputNumber
                    min={0}
                    precision={2}
                    value={testAmount}
                    onChange={(v) => setTestAmount(v ? Number(v) : null)}
                    style={{ width: '100%', marginTop: 4 }}
                  />
                  {amountCredits !== null &&
                    (isQuoteProblem(amountCredits) ? (
                      <Text type="danger">{amountCredits.error}</Text>
                    ) : (
                      amountQuote &&
                      !isQuoteProblem(amountQuote) && (
                        <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
                          <Descriptions.Item label="They get">
                            <Text strong>{amountQuote.credits.toLocaleString()} credits</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Charged">{formatMoney(amountQuote.total, ccy)}</Descriptions.Item>
                        </Descriptions>
                      )
                    ))}
                </div>
              </Space>
            )}
          </Card>

          {saved && (
            <Card title="Saved pricing at common quantities" style={{ marginTop: 16 }}>
              <Table
                rowKey="credits"
                size="small"
                pagination={false}
                dataSource={saved.preview}
                columns={[
                  { title: 'Credits', dataIndex: 'credits', render: (v: number) => v.toLocaleString() },
                  { title: 'Total', dataIndex: 'total', render: (v: string) => formatMoney(Number(v), saved.currency) },
                  {
                    title: 'Per credit',
                    dataIndex: 'effective_unit_price',
                    render: (v: string) => formatUnitPrice(Number(v), saved.currency),
                  },
                  {
                    title: 'Saving',
                    dataIndex: 'savings',
                    render: (v: string) =>
                      Number(v) > 0 ? formatMoney(Number(v), saved.currency) : <Text type="secondary">—</Text>,
                  },
                ]}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Last updated {saved.updated_at ? new Date(saved.updated_at).toLocaleString() : '—'}
                {saved.updated_by_email ? ` by ${saved.updated_by_email}` : ''}
              </Text>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default CreditPricingManagement;
