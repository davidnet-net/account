import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const page = style({
	display: "flex",
	justifyContent: "center",
	alignItems: "flex-start",
	width: "100%",
	padding: `${token.global.spacing.xlarge} ${token.global.spacing.medium}`,
	boxSizing: "border-box"
});

export const card = style({
	width: "100%",
	maxWidth: "520px",
	backgroundColor: token.theme.color.surface.default.normal,
	border: `${token.global.borderWidth.standard} solid ${token.theme.color.border.default}`,
	borderRadius: token.global.radius.xlarge,
	padding: token.global.spacing.xlarge,
	transition: `border-color ${token.global.transition.duration.standard} ${token.global.transition.timing.ease}`
});

export const title = style({
	fontSize: token.global.font.size.xlarge,
	fontWeight: token.global.font.weight.bold,
	color: token.theme.color.text.default,
	fontFamily: token.global.font.family.sans
});

export const subtitle = style({
	fontSize: token.global.font.size.medium,
	color: token.theme.color.text.secondary,
	marginTop: token.global.spacing.xsmall,
	marginBottom: token.global.spacing.large
});

export const formGroup = style({
	display: "flex",
	flexDirection: "column",
	gap: token.global.spacing.xsmall,
	width: "100%"
});

export const label = style({
	fontSize: token.global.font.size.xmedium,
	fontWeight: token.global.font.weight.medium,
	color: token.theme.color.text.default
});

export const imageSectionContainer = style({
	display: "flex",
	flexDirection: "column",
	gap: token.global.spacing.xsmall,
	width: "100%"
});

export const bannerPreview = style({
	position: "relative",
	width: "100%",
	height: "140px",
	borderRadius: token.global.radius.large,
	backgroundColor: token.theme.color.background.subtle.normal,
	backgroundSize: "cover",
	backgroundPosition: "center",
	border: `${token.global.borderWidth.standard} solid ${token.theme.color.border.default}`,
	display: "flex",
	alignItems: "center",
	justifyContent: "center"
});

export const avatarPreview = style({
	position: "relative",
	width: "80px",
	height: "80px",
	borderRadius: "50%",
	backgroundColor: token.theme.color.surface.default.normal,
	backgroundSize: "cover",
	backgroundPosition: "center",
	border: `2px solid ${token.theme.color.border.default}`,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
});

export const overlayCenter = style({
	position: "absolute",
	inset: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	backgroundColor: "rgba(0, 0, 0, 0.35)",
	borderRadius: "inherit"
});

export const bannerOverlay = style({
	position: "absolute",
	bottom: "8px",
	right: "8px",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	zIndex: 2
});

export const cardActions = style({
	display: "flex",
	justifyContent: "flex-end",
	alignItems: "center",
	gap: token.global.spacing.small,
	marginTop: token.global.spacing.xlarge,
	paddingTop: token.global.spacing.large,
	borderTop: `${token.global.borderWidth.standard} solid ${token.theme.color.border.default}`,

	"@media": {
		"screen and (max-width: 480px)": {
			flexDirection: "column-reverse",
			alignItems: "stretch"
		}
	}
});
