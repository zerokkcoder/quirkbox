import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
      <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
        404 · 星舵工坊
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        航线未找到 / Page not found
      </h1>
      <p className="max-w-md text-sm leading-7 text-muted-foreground">
        这个地址不在星图上。This address is not on our chart.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground mt-2 rounded-xl px-5 py-2.5 text-sm font-medium"
      >
        返回首页 / Back home
      </Link>
    </main>
  );
}
