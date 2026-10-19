import type { Metadata } from "next";
import "./style.css";

export const metadata: Metadata = { title: "Agent Lab", description: "架空のドキュメントでエージェントループを試すMVP" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ja"><body>{children}</body></html>;
}
