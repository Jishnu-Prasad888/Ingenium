declare module "react-native-vertical-slider" {
  import { Component } from "react";
  import { ViewStyle, TextStyle } from "react-native";

  interface VerticalSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    width?: number;
    height?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    style?: ViewStyle;
    trackStyle?: ViewStyle;
    thumbStyle?: ViewStyle;
  }

  export default class VerticalSlider extends Component<VerticalSliderProps> {}
}
