import React from 'react';
import { Slider as AntdSlider } from 'antd';
import { SliderType } from './types';


const MAX_LOG_RANGE = 1;
const MIN_LOG_RANGE = 0;


const ROUND_PRECISION = 15;


interface SliderProps {
    value: number;
    min?: number;
    max?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    stepCount: number;
    onChange: (value: number) => void;
    onAfterChange: (value: number) => void;
    sliderType?: SliderType;
    precision?: number;
}


const isInvalid = (num: unknown) => (
    Number.isNaN(num) || typeof num !== 'number'
);


export const Slider = ((props: SliderProps) => {
    const {
        exclusiveMaximum,
        exclusiveMinimum,
        max,
        min,
        onAfterChange,
        onChange,
        precision,
        sliderType,
        stepCount,
        value,
    } = props;

    const safeBreakMinValue = (isInvalid(min) && isInvalid(exclusiveMinimum)) ? value : null;
    const safeBreakMaxValue = (isInvalid(max) && isInvalid(exclusiveMaximum)) ? value : null;
    if (safeBreakMinValue !== null || safeBreakMaxValue !== null) {
        console.warn(`Slider component has received a missing value for the expected ${safeBreakMinValue ? 'minimum / exclusiveMinimum' : 'maximum / exclusiveMaximum'} value.`);
    }


    const isExponential = sliderType === SliderType.EXPONENTIAL;


    const minValue = safeBreakMinValue || (isInvalid(min) ? exclusiveMinimum : min) as number;
    const maxValue = safeBreakMaxValue || (isInvalid(max) ? exclusiveMaximum : max) as number;


    const stepSize = isExponential && stepCount
        ? ((MAX_LOG_RANGE - MIN_LOG_RANGE) / stepCount)
        : (maxValue - minValue) / stepCount;


    const adjustedStepSize = parseFloat(stepSize.toFixed(precision));

    const normalizedRange = Math.log10(maxValue) - Math.log10(minValue);

    let scale = (value: number) => {
        const result = Math.pow(10, (value * normalizedRange) + Math.log10(minValue));
        return parseFloat(result.toPrecision(ROUND_PRECISION));
    };

    const normalize = (value: number) => (value === 0 ? 0 : (Math.log10(value) - Math.log10(minValue)) / normalizedRange);


    const getNewValue = (value: number): number => {
        const newValue: number = Array.isArray(value) ? value[0] : value;
        if (isExponential) {
            return newValue && newValue > 0 ? scale(+newValue) : minValue;
        } else {
            return newValue;
        }
    };


    const onSliderValueChange = (value: number) => {
        onChange(getNewValue(value));
    };


    const onSliderValueAfterChange = (value: number) => {
        onAfterChange(getNewValue(value));
    };


    const isMinExclusive = !isInvalid(exclusiveMinimum);
    const isMaxExclusive = !isInvalid(exclusiveMaximum);
    const isExclusiveRange = isMinExclusive || isMaxExclusive;


    const minValuePrefix =
        isExclusiveRange ?
            isMinExclusive ? '(' : '['
            : '';


    const maxValuePostfix =
        isExclusiveRange ?
            isMaxExclusive ? ')' : ']'
            : '';


    const marks = {
        [isExponential ? MIN_LOG_RANGE : minValue]: `${minValuePrefix}${minValue.toFixed(precision)}`,
        [isExponential ? MAX_LOG_RANGE : maxValue]: `${maxValue.toFixed(precision)}${maxValuePostfix}`,
    };


    const sliderValue = (isExponential && value) ? normalize(value) : value;


    return (
        <AntdSlider
            onAfterChange={onSliderValueAfterChange}
            onChange={onSliderValueChange}
            marks={marks}
            max={isExponential ? MAX_LOG_RANGE : maxValue}
            min={isExponential ? MIN_LOG_RANGE : minValue}
            step={adjustedStepSize}
            tipFormatter={(value) => value !==undefined && getNewValue(value)}
            value={sliderValue}
        />
    );
});
