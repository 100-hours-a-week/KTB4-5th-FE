"use client";

import {
  ServiceBell1Outlined,
  BoxClosedOutlined,
  Home2Outlined,
  PlusOutlined,
  User4Outlined,
} from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { usePathname } from "next/navigation";

import { routes } from "@/shared/routes";
import { AppLink } from "@/shared/ui/app-link";

import styles from "./bottom-tab-navigation.module.css";

function isActiveRoute(pathname: string, href: string) {
  if (href === routes.home) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomTabNavigation() {
  const pathname = usePathname();

  return (
    <nav className={styles.root} aria-label="주요 메뉴">
      <ul className={styles.list}>
        <li>
          <AppLink
            className={styles.link}
            href={routes.home}
            aria-current={
              isActiveRoute(pathname, routes.home) ? "page" : undefined
            }
          >
            <Lineicons
              icon={Home2Outlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>홈</span>
          </AppLink>
        </li>
        <li>
          <AppLink
            className={styles.link}
            href={routes.refrigerator}
            aria-current={
              isActiveRoute(pathname, routes.refrigerator) ? "page" : undefined
            }
          >
            <Lineicons
              icon={BoxClosedOutlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>냉장고</span>
          </AppLink>
        </li>
        <li className={styles.createItem}>
          <AppLink
            className={styles.createLink}
            href={routes.registerIngredient}
          >
            <span className={styles.createIcon} aria-hidden="true">
              <Lineicons
                icon={PlusOutlined}
                size={26}
                strokeWidth={2}
                focusable="false"
              />
            </span>
            <span>등록</span>
          </AppLink>
        </li>
        <li>
          <AppLink
            className={styles.link}
            href={routes.recommendations}
            aria-current={
              isActiveRoute(pathname, routes.recommendations)
                ? "page"
                : undefined
            }
          >
            <Lineicons
              icon={ServiceBell1Outlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>추천</span>
          </AppLink>
        </li>
        <li>
          <AppLink
            className={styles.link}
            href={routes.me}
            aria-current={
              isActiveRoute(pathname, routes.me) ? "page" : undefined
            }
          >
            <Lineicons
              icon={User4Outlined}
              size={22}
              strokeWidth={1.8}
              aria-hidden="true"
              focusable="false"
            />
            <span>마이</span>
          </AppLink>
        </li>
      </ul>
    </nav>
  );
}
