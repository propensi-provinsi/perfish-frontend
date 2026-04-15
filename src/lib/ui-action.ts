type ActionVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "ghost";

type ActionSize = "xs" | "sm" | "md";

const BASE =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const SIZE: Record<ActionSize, string> = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

const VARIANT: Record<ActionVariant, string> = {
  primary: "bg-cyan text-white hover:bg-cyan/80",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  info: "bg-blue-600 text-white hover:bg-blue-700",
  neutral:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5",
  ghost:
    "border border-gray-300/80 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export function actionBtn(variant: ActionVariant, size: ActionSize = "md"): string {
  return `${BASE} ${SIZE[size]} ${VARIANT[variant]}`;
}

