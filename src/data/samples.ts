// Bundled demo inspection images (illustrations in /public/samples). Shared by client and server.

export type ScenarioId = "corrosion_wear" | "crack" | "loose_fastener" | "healthy";

export interface SampleImage {
  id: string;
  label: string;
  description: string;
  url: string;
  scenario: ScenarioId;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "sample-corroded",
    label: "Corroded component",
    description: "Surface rust and wear",
    url: "/samples/corroded.svg",
    scenario: "corrosion_wear",
  },
  {
    id: "sample-cracked",
    label: "Cracked component",
    description: "Visible fracture line",
    url: "/samples/cracked.svg",
    scenario: "crack",
  },
  {
    id: "sample-loose",
    label: "Loose fastening",
    description: "Displaced bolt and clip",
    url: "/samples/loose.svg",
    scenario: "loose_fastener",
  },
  {
    id: "sample-healthy",
    label: "Healthy component",
    description: "Clean, intact surface",
    url: "/samples/healthy.svg",
    scenario: "healthy",
  },
];

export const SCENARIO_LABELS: Record<ScenarioId | "auto", string> = {
  auto: "Auto (derive from image)",
  corrosion_wear: "Corrosion + surface wear",
  crack: "Crack detected",
  loose_fastener: "Loose fastener",
  healthy: "Healthy component",
};

export function getSample(id: string): SampleImage | undefined {
  return SAMPLE_IMAGES.find((s) => s.id === id);
}
