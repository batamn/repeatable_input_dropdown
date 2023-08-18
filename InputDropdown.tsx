import React, { ReactNode, useEffect, useState } from 'react';
import { Popover, InputNumber, Icon } from 'antd';
import _ from 'lodash';
import {
    integer, range, Validate, ValidateHandler
} from '../../validate';
import { concatClasses } from './concatClasses';
import style from '../dropdowns.less';
import { Slider } from './Slider';
import { ArrowKeyPressed, SliderType } from './types';


// NOTE: the following are only used in inputSlider: exclusiveMinimum, exclusiveMaximum & extraValidators
type SliderDropdownProps = {
    committedValue?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    extraValidators?: ValidateHandler[];
    disabled?: boolean;
    isInteger?: boolean;
    max?: number;
    min?: number;
    onAfterChange: (value: number, valid?: boolean) => void;
    onChange: (value: number) => void;
    precision?: number;
    stepCount?: number;
    sliderType?: SliderType;
    unit?: ReactNode | string;
    value: number;
}


const ALIGN_CONFIG = {
    points: ['tl', 'bl'],
    offset: [0, 3],
};

const SLIDER_WIDTH = 300;

const ARROW_CODES: { [key: string]: ArrowKeyPressed } = {
    ArrowLeft: ArrowKeyPressed.Left,
    ArrowRight: ArrowKeyPressed.Right,
    Enter: ArrowKeyPressed.Enter,
    Tab: ArrowKeyPressed.Tab,
};


function getNewValue({
    increment, currentValue, min, max, stepCount
}:
    {
        increment: boolean,
        currentValue: number,
        min: number,
        max: number,
        stepCount: number
    }): number {
    let newValue;
    const stepSize = (max - min) / stepCount;
    if (increment) {
        newValue = parseFloat((currentValue + stepSize).toFixed(10));
        if (newValue > max) {
            newValue = max;
        }
    } else {
        newValue = parseFloat((currentValue - stepSize).toFixed(10));
        if (newValue < min) {
            newValue = min;
        }
    }
    return newValue;
}


const DisabledSlider = ({
    precision, value, unit
}: Pick<SliderDropdownProps, 'precision' | 'unit' | 'value'>) => (
    <InputNumber
        className={concatClasses(
            'slider-input',
            style.slider_dropdown_input,
            style.disabled,
        )}
        disabled
        precision={precision}
        unit={unit}
        value={value}
    />
);


function EnabledSlider({
    committedValue,
    disabled,
    exclusiveMinimum,
    exclusiveMaximum,
    extraValidators,
    isInteger,
    max,
    min,
    onAfterChange,
    onChange,
    precision,
    stepCount = SLIDER_WIDTH,
    sliderType,
    value,
    unit
}: SliderDropdownProps) {
    const [isPopoverOpen, setPopoverOpen] = useState(false);

    const minValue = (min == undefined ? exclusiveMinimum : min) as number;
    const maxValue = (max == undefined ? exclusiveMaximum : max) as number;


    const overlayClassName = concatClasses(style.slider_dropdown);
    const popoverClassName = concatClasses(
        'slider-input',
        style.slider_dropdown_input,
    );


    const inputNumberValidators = _.flatten([isInteger ? [integer()] : [], extraValidators ?? [], [range({ min, max, isInteger })]]);


    const onKeyDown = (event: KeyboardEvent) => {
        const keyPressed = ARROW_CODES[event.key] || ArrowKeyPressed.None;


        if (keyPressed === ArrowKeyPressed.None) return;


        if (keyPressed === ArrowKeyPressed.Enter || keyPressed === ArrowKeyPressed.Tab) {
            setPopoverOpen(false);
            return;
        }


        if (minValue < maxValue) {
            const increment = keyPressed === ArrowKeyPressed.Right;
            const newValue = getNewValue({
                increment, currentValue: value, min: minValue, max: maxValue, stepCount
            });
            onChange(newValue);
        }
    };


    useEffect(() => {
        if (isPopoverOpen) {
            document.addEventListener('keydown', onKeyDown, false);
        } else {
            document.removeEventListener('keydown', onKeyDown);
        }


        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isPopoverOpen]);


    const onValueChange = async (targetValue: number | string) => {
        if (typeof targetValue === 'number') onChange(targetValue);
    };


    const onValidateChange = async (targetValue: number, onValidate: ValidateHandler) => {
        let adjustedValue = targetValue;
        const adjustedMinimum = parseFloat(minValue.toFixed(precision));
        const adjustedMaximum = parseFloat(maxValue.toFixed(precision));


        if (adjustedValue === adjustedMinimum) adjustedValue = minValue;
        if (adjustedValue === adjustedMaximum) adjustedValue = maxValue;


        const { valid } = await onValidate(adjustedValue);


        if (valid && adjustedValue !== committedValue) onAfterChange(adjustedValue, valid);
    };


    const onBlur = (e: React.FocusEvent<HTMLElement>, onValidate: ValidateHandler) => {
        if (isPopoverOpen) e.target.focus();
        else onValidateChange(value, onValidate);
    };


    return (
        <Validate validators={[...inputNumberValidators]}>
            {(onValidate: ValidateHandler) => (
                <Popover
                    align={ALIGN_CONFIG}
                    arrowPointAtCenter={false}
                    className={popoverClassName}
                    content={(
                        <Slider
                            exclusiveMinimum={exclusiveMinimum}
                            exclusiveMaximum={exclusiveMaximum}
                            value={value}
                            max={max}
                            min={min}
                            onAfterChange={(val) => onValidateChange(val, onValidate)}
                            onChange={(val) => onValueChange(val)}
                            precision={isInteger ? 0 : precision}
                            sliderType={sliderType}
                            stepCount={stepCount}
                        />
                    )}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || window.document.body}
                    onVisibleChange={setPopoverOpen}
                    overlayClassName={overlayClassName}
                    trigger={['click']}
                    visible={isPopoverOpen}
                >
                    <InputNumber
                        addonAfter={(
                            <span
                                className={`arrow-down${isPopoverOpen ? ' open' : ''}`}
                                onClick={() => setPopoverOpen(!isPopoverOpen)}
                            >
                                <Icon type="collapse-down" />
                            </span>
                        )}
                        disabled={disabled}
                        onBlur={(e) => onBlur(e, onValidate)}
                        onChange={(val) => onValueChange(val)}
                        onPressEnter={() => onValidateChange(value, onValidate)}
                        precision={isInteger ? 0 : precision}
                        step={isInteger ? 1 : 'any'}
                        type="number"
                        value={value}
                    />
                </Popover>
            )}
        </Validate>
    );
}


export function SliderDropdown(props: SliderDropdownProps) {
    const {
        disabled,
        max,
        min,
        precision,
        unit,
        value
    } = props;
    return disabled || min === max ? (
        <DisabledSlider precision={precision} unit={unit} value={value} />
    ) : (
        <EnabledSlider {...props} />
    );
}
