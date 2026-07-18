export type DeviceSignals = Readonly<{
  viewportWidth: number;
  finePointer: boolean;
  maxTouchPoints: number;
}>;

export const DESKTOP_GATE_WIDTH = 900;

export function shouldShowDesktopGate({
  viewportWidth,
  finePointer,
  maxTouchPoints,
}: DeviceSignals): boolean {
  return viewportWidth >= DESKTOP_GATE_WIDTH || (finePointer && maxTouchPoints === 0);
}

export function readDeviceSignals(): DeviceSignals {
  return {
    viewportWidth: window.innerWidth,
    finePointer: window.matchMedia('(pointer: fine)').matches,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}
