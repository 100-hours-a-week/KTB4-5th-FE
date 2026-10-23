// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { prepareProfileImage } from "../lib/prepare-profile-image";
import { ProfileImageField } from "./profile-image-field";
vi.mock("@/entities/user", () => ({ UserAvatar: () => null }));
afterEach(cleanup);
it.each([
  "profiles/default.png",
  "https://cdn.example.com/profiles/default.png?signature=qa",
  null,
])("기본 프로필 %s에는 삭제 버튼이 없다", (src) => {
  render(
    <ProfileImageField
      src={src}
      error={null}
      isUploading={false}
      onPick={vi.fn()}
      onReset={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "프로필 사진 지우기" }),
  ).toBeNull();
  expect(
    screen.getByLabelText("프로필 사진 변경").getAttribute("accept"),
  ).not.toContain("heic");
});
it("사용자가 올린 사진에는 삭제 버튼이 있다", () => {
  render(
    <ProfileImageField
      src="https://cdn.example.com/profiles/custom.png"
      error={null}
      isUploading={false}
      onPick={vi.fn()}
      onReset={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("button", { name: "프로필 사진 지우기" }),
  ).toBeTruthy();
});
it.each(["image/heic", "image/heif", ""])(
  "HEIC는 디코딩 전에 지원 형식 오류로 안내한다 (%s)",
  async (type) => {
    await expect(
      prepareProfileImage(new File(["qa"], "photo.heic", { type })),
    ).rejects.toMatchObject({ reason: "type" });
  },
);
