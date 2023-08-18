export const concatClasses = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};