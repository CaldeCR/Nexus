import { Button, Card, Chip, Field, Input, Select, Textarea } from '../ui/ui';

export function DesignSystemDemo() {
  return (
    <div className="ui-design-shell">
      <div className="ui-design-grid">
        <Card title="Sistema de diseño Nexus" icon="N" actions={<Chip tone="info">Design system</Chip>}>
          <div className="ui-demo-row">
            <Button>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Peligro</Button>
            <Button variant="primary" loading>Loading</Button>
          </div>
        </Card>

        <Card title="Chips y estado" icon="C">
          <div className="ui-demo-row">
            <Chip tone="success">Activo</Chip>
            <Chip tone="warning">Retraso</Chip>
            <Chip tone="danger">Sobrepresupuesto</Chip>
            <Chip tone="neutral">Neutro</Chip>
            <Chip tone="info">Plantilla</Chip>
          </div>
        </Card>

        <Card title="Campos" icon="F">
          <div style={{ display: 'grid', gap: '18px' }}>
            <Field label="Nombre del proyecto" hint="Ejemplo: Rediseño de onboarding">
              <Input defaultValue="Proyecto de renovación" />
            </Field>

            <Field label="Descripción" hint="Resumen breve del alcance" error="Este campo es obligatorio">
              <Textarea defaultValue="Necesitamos mejorar la experiencia del cliente y la capacidad del equipo." error />
            </Field>

            <Field label="Plantilla">
              <Select defaultValue="kanban">
                <option value="kanban">Kanban</option>
                <option value="scrum">Scrum</option>
                <option value="pmi">PMI</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}
