import { Badge } from "./index";

const VARIANTS = [
  "primary",
  "success",
  "warning",
  "error",
  "info",
  "gray",
  "ev",
  "purple",
];

const meta = {
  title: "v5/Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: VARIANTS },
    dot: { control: "boolean" },
    children: { control: "text" },
  },
  args: {
    variant: "primary",
    dot: false,
    children: "Active",
  },
};
export default meta;

export const Primary = {};

export const WithDot = {
  args: { dot: true, variant: "success", children: "Live" },
};

export const AllVariants = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const DotVariants = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant} dot>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};
