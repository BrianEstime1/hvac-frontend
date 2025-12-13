declare module "react-signature-canvas" {
  import { Component, CanvasHTMLAttributes } from "react";

  export interface SignatureCanvasProps {
    penColor?: string;
    backgroundColor?: string;
    canvasProps?: CanvasHTMLAttributes<HTMLCanvasElement>;
  }

  export default class SignatureCanvas extends Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    getTrimmedCanvas(): HTMLCanvasElement;
  }
}
