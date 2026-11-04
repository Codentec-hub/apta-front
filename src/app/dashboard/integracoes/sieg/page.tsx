import { redirect } from "next/navigation";

import { paths } from "@/paths";

// A lista de empresas virou a primeira aba da área SIEG.
export default function Page(): never {
	redirect(paths.dashboard.sieg);
}
