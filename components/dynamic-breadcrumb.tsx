"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeLabels: { [key: string]: string } = {
  dashboard: "Dashboard",
  telemetry: "Telemetry Dashboard",
  // Add more mappings as needed
};

const basePath = "/jam-dashboard";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const pathSegments = pathname
    .replace(basePath, "")
    .split("/")
    .filter((segment) => segment !== "");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href={basePath}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = `${basePath}/${pathSegments
            .slice(0, index + 1)
            .join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = routeLabels[segment] || segment;

          return (
            <BreadcrumbItem key={href}>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
