import { useEffect, useState, useRef } from "react";
import { RadioTopBar } from "./RadioTopBar";
import { ChristmasBar } from "./ChristmasBar";

interface Props {
  isChristmas: boolean;
}

export default function TopbarFixed({ isChristmas }: Props) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef<number>(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handle = () => {
      const currentY = window.scrollY || window.pageYOffset;
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          // Se descer além do limite, esconde o topo
          if (currentY > lastY.current && currentY > 50) {
            setHidden(true);
          // Só reexibe quando estivermos no topo (ou muito próximo)
          } else if (currentY <= 50) {
            setHidden(false);
          }
          lastY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50 transform transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
      aria-hidden={hidden}
    >
      {isChristmas && <ChristmasBar />}
      <RadioTopBar />
    </div>
  );
}
