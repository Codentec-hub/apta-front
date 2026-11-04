import * as React from "react";
import type { Metadata } from "next";

import { config } from "@/config";
import { SiegView } from "@/components/dashboard/sieg/sieg-view";

export const metadata = { title: `SIEG | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
	return (
		<React.Suspense>
			<SiegView />
		</React.Suspense>
	);
}
