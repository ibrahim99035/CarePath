import Link from "next/link";
import { ChevronRightIcon } from "@/components/Icons";

export default function PageHeader({ title, sub, backHref = "/", backLabel = "رجوع" }) {
  return (
    <div className="page-head">
      <Link href={backHref} className="icon-btn" aria-label={backLabel}>
        <ChevronRightIcon />
      </Link>
      <div>
        <h1>{title}</h1>
        {sub ? <span className="sub">{sub}</span> : null}
      </div>
    </div>
  );
}
