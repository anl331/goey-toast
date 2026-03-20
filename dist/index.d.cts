import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { ToasterProps, ExternalToast } from 'sonner';

interface AnimationPreset {
    bounce: number;
    spring: boolean;
}
declare const animationPresets: {
    readonly smooth: {
        readonly bounce: 0.1;
        readonly spring: true;
    };
    readonly bouncy: {
        readonly bounce: 0.6;
        readonly spring: true;
    };
    readonly subtle: {
        readonly bounce: 0.05;
        readonly spring: true;
    };
    readonly snappy: {
        readonly bounce: 0.4;
        readonly spring: true;
    };
};
type AnimationPresetName = keyof typeof animationPresets;

type GooeyToastType = 'default' | 'success' | 'error' | 'warning' | 'info';
interface GooeyToastTimings {
    displayDuration?: number;
}
interface GooeyToastClassNames {
    wrapper?: string;
    content?: string;
    header?: string;
    title?: string;
    icon?: string;
    description?: string;
    actionWrapper?: string;
    actionButton?: string;
}
interface GooeyToastAction {
    label: string;
    onClick: () => void;
    successLabel?: string;
}
interface GooeyToastOptions {
    description?: ReactNode;
    action?: GooeyToastAction;
    icon?: ReactNode;
    duration?: number;
    id?: string | number;
    classNames?: GooeyToastClassNames;
    fillColor?: string;
    borderColor?: string;
    borderWidth?: number;
    timing?: GooeyToastTimings;
    preset?: AnimationPresetName;
    spring?: boolean;
    bounce?: number;
    showProgress?: boolean;
    onDismiss?: (id: string | number) => void;
    onAutoClose?: (id: string | number) => void;
}
interface GooeyPromiseData<T> {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: unknown) => string);
    description?: {
        loading?: ReactNode;
        success?: ReactNode | ((data: T) => ReactNode);
        error?: ReactNode | ((error: unknown) => ReactNode);
    };
    action?: {
        success?: GooeyToastAction;
        error?: GooeyToastAction;
    };
    classNames?: GooeyToastClassNames;
    fillColor?: string;
    borderColor?: string;
    borderWidth?: number;
    timing?: GooeyToastTimings;
    preset?: AnimationPresetName;
    spring?: boolean;
    bounce?: number;
    onDismiss?: (id: string | number) => void;
    onAutoClose?: (id: string | number) => void;
}
interface GooeyToastUpdateOptions {
    title?: string;
    description?: ReactNode;
    type?: GooeyToastType;
    action?: GooeyToastAction;
    icon?: ReactNode | null;
}
interface DismissFilter {
    type: GooeyToastType | GooeyToastType[];
}
interface GooeyToasterProps {
    position?: ToasterProps['position'];
    duration?: number;
    gap?: number;
    offset?: number | string;
    theme?: 'light' | 'dark';
    toastOptions?: Partial<ExternalToast>;
    expand?: boolean;
    closeButton?: boolean;
    richColors?: boolean;
    visibleToasts?: number;
    dir?: 'ltr' | 'rtl';
    preset?: AnimationPresetName;
    spring?: boolean;
    bounce?: number;
    swipeToDismiss?: boolean;
    closeOnEscape?: boolean;
    maxQueue?: number;
    queueOverflow?: 'drop-oldest' | 'drop-newest';
    showProgress?: boolean;
}

declare function GooeyToaster({ position, duration, gap, offset, theme, toastOptions, expand, closeButton, richColors, visibleToasts, dir, preset, spring, bounce, swipeToDismiss, closeOnEscape, maxQueue, queueOverflow, showProgress, }: GooeyToasterProps): react_jsx_runtime.JSX.Element;

declare function updateGooeyToast(id: string | number, options: GooeyToastUpdateOptions): void;
declare function dismissGooeyToast(idOrFilter?: string | number | DismissFilter): void;
declare const gooeyToast: ((title: string, options?: GooeyToastOptions) => string | number) & {
    success: (title: string, options?: GooeyToastOptions) => string | number;
    error: (title: string, options?: GooeyToastOptions) => string | number;
    warning: (title: string, options?: GooeyToastOptions) => string | number;
    info: (title: string, options?: GooeyToastOptions) => string | number;
    promise: <T>(promise: Promise<T>, data: GooeyPromiseData<T>) => string;
    dismiss: typeof dismissGooeyToast;
    update: typeof updateGooeyToast;
};

export { type AnimationPreset, type AnimationPresetName, type DismissFilter, type GooeyPromiseData as GoeyPromiseData, type GooeyToastClassNames as GoeyToastClassNames, type GooeyToastOptions as GoeyToastOptions, type GooeyToastTimings as GoeyToastTimings, GooeyToaster as GoeyToaster, type GooeyToasterProps as GoeyToasterProps, type GooeyPromiseData, type GooeyToastAction, type GooeyToastClassNames, type GooeyToastOptions, type GooeyToastTimings, type GooeyToastUpdateOptions, GooeyToaster, type GooeyToasterProps, animationPresets, gooeyToast as goeyToast, gooeyToast };
