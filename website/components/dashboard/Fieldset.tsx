interface FieldsetProps {
  title: string;
  children: React.ReactNode;
}

export function Fieldset({ title, children }: FieldsetProps) {
  return (
    <div className="border border-card-border overflow-hidden">
      <div className="bg-surface px-4 py-2.5 border-b border-card-border">
        <h3 className="text-text-primary text-sm font-semibold">{title}</h3>
      </div>
      <div className="bg-card p-4">{children}</div>
    </div>
  );
}
