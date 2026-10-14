"use client";

import { XmarkOutlined } from "@lineiconshq/free-icons";
import { Lineicons } from "@lineiconshq/react-lineicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Area } from "react-easy-crop";

import { uploadImage } from "@/entities/image";
import { refrigeratorQueries } from "@/entities/refrigerator";
import { UserAvatar, userQueries, type Me } from "@/entities/user";
import { useFormLeaveGuard } from "@/features/ingredient-form";
import {
  isValidNickname,
  NICKNAME_DISALLOWED_CHARS,
  NICKNAME_HINT,
  NICKNAME_LENGTH_ERROR,
  NICKNAME_MAX_LENGTH,
} from "@/features/oauth-signup";
import { ApiError } from "@/shared/api";
import { markAppNavigationIntent } from "@/shared/lib/navigation-history";
import { routes } from "@/shared/routes";
import { AppDialog } from "@/shared/ui/app-dialog";
import { showAppToast } from "@/shared/ui/app-toast";
import {
  AsyncViewState,
  asyncViewActionClassName,
} from "@/shared/ui/async-view-state";
import { FieldHelperText } from "@/shared/ui/field-helper-text";
import { FooterButton } from "@/shared/ui/footer-button";
import { PageActionLayout } from "@/shared/ui/page-action-layout";

import {
  updateMyProfile,
  type UpdateMyProfileRequest,
} from "../api/my-profile";
import {
  cropProfilePhoto,
  getProfilePhotoFileError,
  PROFILE_PHOTO_ACCEPT,
  PROFILE_PHOTO_HINT,
  PROFILE_PHOTO_READ_ERROR,
} from "../lib/profile-photo";
import { ProfilePhotoCropper } from "./profile-photo-cropper";
import { WithdrawAccountButton } from "./withdraw-account-button";

const FORM_ID = "my-profile-form";

type PhotoDraft =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "uploaded"; objectKey: string; previewUrl: string };

function getNicknameServerError(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === "USER-409-001") return "이미 사용 중이에요";
  if (error.code === "USER-422-001")
    return "사용할 수 없는 단어가 포함돼 있어요";
  return null;
}

export function MyProfilePage() {
  const { data, error, isError, isFetching, refetch } = useQuery(
    userQueries.me(),
  );

  if (data) return <MyProfileForm me={data} />;

  return (
    <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      {isError ? (
        <AsyncViewState
          status="error"
          title={
            error instanceof ApiError
              ? "프로필을 불러오지 못했어요"
              : "네트워크 연결을 확인해 주세요"
          }
          description="잠시 후 다시 시도해 주세요"
          action={
            <button
              type="button"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={asyncViewActionClassName}
            >
              {isFetching ? "로딩 중" : "다시 시도"}
            </button>
          }
        />
      ) : (
        <AsyncViewState status="loading" title="프로필을 불러오는 중입니다" />
      )}
    </main>
  );
}

function MyProfileForm({ me }: { me: Me }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(me.nickname);
  const [nicknameServerError, setNicknameServerError] = useState<string | null>(
    null,
  );
  const [photo, setPhoto] = useState<PhotoDraft>({ kind: "unchanged" });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const previewUrl = photo.kind === "uploaded" ? photo.previewUrl : null;
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!cropSrc) return;
    return () => URL.revokeObjectURL(cropSrc);
  }, [cropSrc]);

  const trimmedNickname = nickname.trim();
  const isDirty = trimmedNickname !== me.nickname || photo.kind !== "unchanged";
  const nicknameError =
    trimmedNickname.length === 0
      ? "닉네임을 입력해주세요"
      : !isValidNickname(trimmedNickname)
        ? NICKNAME_LENGTH_ERROR
        : nicknameServerError;
  const shownPhotoUrl =
    photo.kind === "uploaded"
      ? photo.previewUrl
      : photo.kind === "removed"
        ? null
        : me.profileImageUrl;

  const leaveDialog = useFormLeaveGuard({
    formId: FORM_ID,
    isGuarded: isDirty && !isSaved,
    title: "저장하지 않고 나갈까요?",
    description: "바꾼 내용이 사라져요.",
    continueLabel: "계속 수정",
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ src, area }: { src: string; area: Area }) => {
      const file = await cropProfilePhoto(src, area);
      const objectKey = await uploadImage(file, "PROFILE");
      return { objectKey, previewUrl: URL.createObjectURL(file) };
    },
    onSuccess: ({ objectKey, previewUrl }) => {
      setPhoto({ kind: "uploaded", objectKey, previewUrl });
      setPhotoError(null);
      setCropSrc(null);
    },
    onError: () => {
      showAppToast({ message: "사진을 저장하지 못했어요", variant: "error" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: async () => {
      setIsSaved(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userQueries.me().queryKey }),
        queryClient.invalidateQueries({ queryKey: refrigeratorQueries.all() }),
      ]);
      showAppToast({ message: "저장했어요", variant: "success" });
      markAppNavigationIntent("replace", routes.me);
      router.replace(routes.me);
    },
    onError: (error) => {
      const serverError = getNicknameServerError(error);

      if (serverError) {
        setNicknameServerError(serverError);
        return;
      }

      showAppToast({
        message: "저장하지 못했어요. 다시 시도해 주세요",
        variant: "error",
      });
    },
  });

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const error = getProfilePhotoFileError(file);
    setPhotoError(error);
    if (!error) setCropSrc(URL.createObjectURL(file));
  }

  function save() {
    const request: UpdateMyProfileRequest = { nickname: trimmedNickname };

    if (photo.kind === "uploaded") request.profileImage = photo.objectKey;
    if (photo.kind === "removed") request.profileImage = null;

    saveMutation.mutate(request);
  }

  return (
    <>
      <PageActionLayout
        action={
          <div className="flex">
            <FooterButton
              form={FORM_ID}
              type="submit"
              disabled={
                !isDirty || nicknameError !== null || saveMutation.isPending
              }
            >
              {saveMutation.isPending ? "로딩 중" : "저장"}
            </FooterButton>
          </div>
        }
      >
        <form
          id={FORM_ID}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
          className="flex flex-col gap-5 px-5 pt-3 pb-6"
        >
          <section className="flex flex-col items-center">
            <div className="relative">
              <UserAvatar src={shownPhotoUrl} size={88} />
              {shownPhotoUrl ? (
                <button
                  type="button"
                  aria-label="프로필 사진 지우기"
                  onClick={() => {
                    setPhoto({ kind: "removed" });
                    setPhotoError(null);
                  }}
                  className="absolute -top-2.5 -right-2.5 grid size-[var(--tap-min)] place-items-center"
                >
                  <span className="grid size-6 place-items-center rounded-full bg-app-ink text-white">
                    <Lineicons
                      icon={XmarkOutlined}
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 min-h-[var(--tap-min)] rounded-full border-[1.5px] border-[color-mix(in_srgb,var(--color-ink)_18%,transparent)] bg-white px-[18px] text-[13.5px] font-bold text-app-ink hover:bg-app-neutral-100"
            >
              사진 변경
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={PROFILE_PHOTO_ACCEPT}
              onChange={selectPhoto}
              className="hidden"
            />
            <div className="w-full text-center">
              <FieldHelperText
                id="profile-photo-help"
                hint={PROFILE_PHOTO_HINT}
                error={photoError ?? undefined}
              />
            </div>
          </section>

          <div>
            <label
              htmlFor="nickname"
              className="block text-[15px] font-bold text-app-ink"
            >
              닉네임
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-[4px] bg-white px-4 shadow-app-sm focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-app-primary">
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(event) => {
                  setNickname(
                    event.target.value.replace(NICKNAME_DISALLOWED_CHARS, ""),
                  );
                  setNicknameServerError(null);
                }}
                maxLength={NICKNAME_MAX_LENGTH}
                autoComplete="nickname"
                aria-describedby="nickname-help"
                aria-invalid={nicknameError ? true : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent py-[14px] text-[16px] font-bold text-app-ink outline-none"
              />
              <span className="flex-none text-[13px] text-app-ink/45">
                {trimmedNickname.length} / {NICKNAME_MAX_LENGTH}
              </span>
            </div>
            <p
              id="nickname-help"
              aria-live="polite"
              className={`mb-0 mt-1 text-sm leading-5 ${nicknameError ? "text-app-primary" : "text-app-ink/50"}`}
            >
              {nicknameError ?? NICKNAME_HINT}
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-[15px] font-bold text-app-ink"
            >
              이메일
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-[4px] bg-app-neutral-100 px-4">
              <input
                id="email"
                type="email"
                value={me.email ?? ""}
                disabled
                className="min-w-0 flex-1 truncate border-0 bg-transparent py-[14px] font-app-body text-[16px] text-app-ink/45"
              />
              <span className="flex-none text-[13px] text-app-ink/45">
                수정 불가
              </span>
            </div>
          </div>

          <div className="pt-6">
            <WithdrawAccountButton />
          </div>
        </form>
      </PageActionLayout>

      {cropSrc ? (
        <ProfilePhotoCropper
          src={cropSrc}
          isApplying={uploadMutation.isPending}
          onCancel={() => setCropSrc(null)}
          onApply={(area) => uploadMutation.mutate({ src: cropSrc, area })}
          onLoadError={() => {
            setCropSrc(null);
            setPhotoError(PROFILE_PHOTO_READ_ERROR);
          }}
        />
      ) : null}

      <AppDialog {...leaveDialog} />
    </>
  );
}
