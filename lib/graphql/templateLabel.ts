export function parseTemplateInfo(typeName: string): { pretty: string; id?: string } {
  let name = typeName.replace(/^C__+/, '');
  const m = name.match(/_(?<id>[0-9a-fA-F]{32})$/);
  let id: string | undefined;
  if (m?.groups?.id) {
    const raw = m.groups.id.toLowerCase();
    id = `${raw.slice(0,8)}-${raw.slice(8,12)}-${raw.slice(12,16)}-${raw.slice(16,20)}-${raw.slice(20)}`;
    name = name.slice(0, -33);
  }
  const pretty = name.replace(/_+/g, ' ').trim() || typeName;
  return { pretty, id };
}
