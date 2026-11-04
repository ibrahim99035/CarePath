"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  HospitalIcon,
  MapIcon,
  CrossIcon,
  InfoIcon,
} from "@/components/Icons";

const items = [
  { href: "/", label: "الرئيسية", Icon: HomeIcon, match: (p) => p === "/" },
  {
    href: "/facilities/",
    label: "المنشآت",
    Icon: HospitalIcon,
    match: (p) => p.startsWith("/facilities"),
  },
  {
    href: "/map/",
    label: "الخريطة",
    Icon: MapIcon,
    match: (p) => p.startsWith("/map"),
  },
  {
    href: "/emergency/",
    label: "الطوارئ",
    Icon: CrossIcon,
    match: (p) => p.startsWith("/emergency"),
    danger: true,
  },
  {
    href: "/about/",
    label: "عن التطبيق",
    Icon: InfoIcon,
    match: (p) => p.startsWith("/about"),
  },
];

export default function BottomNav() {
  const pathname = usePathname() || "/";

  // Keep the guided flow distraction-free.
  if (pathname.startsWith("/guide")) return null;

  return (
    <nav className="bottom-nav" aria-label="التنقل الرئيسي">
      <div className="bottom-nav__inner">
        {items.map(({ href, label, Icon, match, danger }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "nav-item",
                active ? "is-active" : "",
                active && danger ? "is-active--danger" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon />
              <span>{label}</span>
              <span className="nav-item__dot" aria-hidden="true" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
