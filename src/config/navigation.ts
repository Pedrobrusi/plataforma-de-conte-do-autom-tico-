import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarRange,
  CalendarDays,
  Link2,
  MessageCircle,
  Quote,
  PlayCircle,
  Sparkles,
  Building2,
  GalleryHorizontal,
  MessageSquareText,
  User,
  Moon,
  Clapperboard,
  FileText,
  Magnet,
  Palette,
  Library,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  status: "live" | "planned";
  phase?: number;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, status: "live" },
      { label: "Planejador", href: "/planejador", icon: CalendarRange, status: "planned", phase: 2 },
      { label: "Calendário", href: "/calendario", icon: CalendarDays, status: "planned", phase: 2 },
      { label: "Conexões", href: "/conexoes", icon: Link2, status: "live" },
    ],
  },
  {
    title: "Posts",
    items: [
      { label: "Post Twitter", href: "/posts/twitter", icon: MessageCircle, status: "planned", phase: 3 },
      { label: "Frase de Efeito", href: "/posts/frase-de-efeito", icon: Quote, status: "planned", phase: 3 },
      { label: "Post YouTube", href: "/posts/youtube", icon: PlayCircle, status: "planned", phase: 3 },
      { label: "Post GPT", href: "/posts/gpt", icon: Sparkles, status: "planned", phase: 3 },
      { label: "Google Post", href: "/posts/google", icon: Building2, status: "planned", phase: 3 },
    ],
  },
  {
    title: "Carrosséis",
    items: [
      { label: "Carrossel IA", href: "/carrosseis/ia", icon: GalleryHorizontal, status: "planned", phase: 4 },
      { label: "Carrossel Twitter", href: "/carrosseis/twitter", icon: MessageSquareText, status: "planned", phase: 5 },
      { label: "Carrossel Pessoal", href: "/carrosseis/pessoal", icon: User, status: "planned", phase: 5 },
      { label: "Carrossel Dark", href: "/carrosseis/dark", icon: Moon, status: "planned", phase: 5 },
    ],
  },
  {
    title: "Vídeo & Roteiro",
    items: [
      { label: "Criador de Reels", href: "/reels/criador", icon: Clapperboard, status: "planned", phase: 5 },
      { label: "Roteiro Reels", href: "/reels/roteiro", icon: FileText, status: "planned", phase: 5 },
    ],
  },
  {
    title: "Marca & Criativos",
    items: [
      { label: "Bio Magnética", href: "/marca/bio", icon: Magnet, status: "planned", phase: 7 },
      { label: "Criativos", href: "/marca/criativos", icon: Palette, status: "planned", phase: 7 },
      { label: "Biblioteca", href: "/biblioteca", icon: Library, status: "planned", phase: 2 },
    ],
  },
];
