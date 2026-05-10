import aristaLogo from '@/assets/arista_crm.png';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  className?: string;
  /** Controls overall scale. Defaults to 'md'. */
  size?: 'sm' | 'md' | 'lg';
  /** Show only the image mark, no text. */
  iconOnly?: boolean;
};

const sizeMap = {
  sm: { img: 'size-5', text: 'text-[13px]', gap: 'gap-2' },
  md: { img: 'size-7', text: 'text-[16px]', gap: 'gap-2.5' },
  lg: { img: 'size-9', text: 'text-[20px]', gap: 'gap-3' },
};

export function AppLogo({
  className,
  size = 'md',
  iconOnly = false,
}: AppLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn('flex items-center', s.gap, className)}>
      <img
        src={aristaLogo}
        alt="Arista CRM"
        className={cn(s.img, 'shrink-0 object-contain')}
      />
      {!iconOnly && (
        <div className={cn('flex items-baseline gap-1 leading-none', s.text)}>
          <span className="font-bold tracking-tight text-current">Arista</span>
          <span className="font-light opacity-40">CRM</span>
        </div>
      )}
    </div>
  );
}
