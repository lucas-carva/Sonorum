declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  
  export const Music: ComponentType<LucideProps>;
  export const RotateCcw: ComponentType<LucideProps>;
  export const Camera: ComponentType<LucideProps>;
  export const CameraOff: ComponentType<LucideProps>;
  
  // Adicione outros ícones conforme necessário
}

