import type { CSSProperties, ReactNode } from "react";
import type { DesignDocument, DesignElement, DesignBackground } from "./document";

/**
 * Converte um DesignDocument em uma árvore de elementos React. Esta é a
 * ÚNICA função que sabe desenhar um documento. É usada tanto pelo preview
 * no editor (React DOM normal, no browser) quanto pelo renderizador PNG no
 * servidor (`next/og` ImageResponse, que usa Satori para o layout). Por isso
 * todo estilo aqui fica restrito ao subconjunto de CSS que os dois ambientes
 * entendem: display flex explícito em cada nó, position absolute com
 * left/top/width/height, sem grid, sem CSS variables, sem `gap`.
 */

function backgroundStyle(background: DesignBackground): CSSProperties {
  if (background.type === "image" && background.imageSrc) {
    return { backgroundImage: `url(${background.imageSrc})`, backgroundSize: "cover" };
  }
  if (background.type === "gradient" && background.gradientFrom && background.gradientTo) {
    const angle = background.gradientAngle ?? 135;
    return {
      backgroundImage: `linear-gradient(${angle}deg, ${background.gradientFrom}, ${background.gradientTo})`,
    };
  }
  return { backgroundColor: background.color };
}

function renderTextElement(el: Extract<DesignElement, { type: "text" }>): ReactNode {
  const words = el.content.split(/\s+/).filter(Boolean);
  const highlight = el.highlightSubstring?.trim().toLowerCase();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        alignContent:
          el.verticalAlign === "middle" ? "center" : el.verticalAlign === "bottom" ? "flex-end" : "flex-start",
        justifyContent:
          el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
        width: "100%",
        height: "100%",
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        fontWeight: el.fontWeight,
        lineHeight: el.lineHeight,
        letterSpacing: el.letterSpacing,
        color: el.color,
        textAlign: el.align,
      }}
    >
      {words.map((word, i) => {
        const isHighlighted = highlight && word.toLowerCase().replace(/[.,!?]/g, "") === highlight;
        return (
          <span
            key={i}
            style={{
              display: "flex",
              marginRight: 10,
              color: isHighlighted ? el.highlightColor ?? el.color : el.color,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

function renderImageElement(el: Extract<DesignElement, { type: "image" }>): ReactNode {
  if (!el.src) {
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#26282B",
          borderRadius: el.borderRadius,
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={el.src}
      width={el.width}
      height={el.height}
      style={{
        width: "100%",
        height: "100%",
        objectFit: el.fit,
        objectPosition: `${el.focalX * 100}% ${el.focalY * 100}%`,
        borderRadius: el.borderRadius,
      }}
      alt=""
    />
  );
}

function renderShapeElement(el: Extract<DesignElement, { type: "shape" }>): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: el.fill,
        borderRadius: el.shape === "circle" ? "50%" : el.borderRadius,
        border: el.strokeWidth ? `${el.strokeWidth}px solid ${el.stroke ?? "transparent"}` : undefined,
      }}
    />
  );
}

function renderElement(el: DesignElement): ReactNode {
  // zIndex não é suportado pelo Satori (renderizador de PNG) — a ordem de
  // empilhamento vem exclusivamente da ordem de renderização (documentToJsx
  // já ordena os elementos por zIndex antes de chamar esta função).
  const wrapperStyle: CSSProperties = {
    display: "flex",
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    opacity: el.opacity,
    ...(el.rotation ? { transform: `rotate(${el.rotation}deg)` } : {}),
  };

  let child: ReactNode;
  if (el.type === "text") child = renderTextElement(el);
  else if (el.type === "image") child = renderImageElement(el);
  else child = renderShapeElement(el);

  return (
    <div key={el.id} style={wrapperStyle}>
      {child}
    </div>
  );
}

export function documentToJsx(doc: DesignDocument): ReactNode {
  const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: doc.canvas.width,
        height: doc.canvas.height,
        overflow: "hidden",
        ...backgroundStyle(doc.background),
      }}
    >
      {sorted.map(renderElement)}
    </div>
  );
}
