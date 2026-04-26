import { token } from "@davidnet-net/svelte-ui/tokens";
import { style } from "@vanilla-extract/css";

export const background = style({
	height: "100%",
	width: "100%",
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center"
});

export const container = style({
	height: "fit-content",
	minHeight: "600px",
	width: "400px",
	backgroundColor: token.theme.color.surface.sunken.normal,
	borderRadius: token.global.radius.huge,
	padding: token.global.spacing.large,
	borderWidth: token.global.borderWidth.thick,
	borderStyle: "solid",
	borderColor: token.theme.color.border.default,
	display: "flex",
	alignItems: "center",
	flexDirection: "column",
	gap: token.global.spacing.small
});

export const brand = style({
	fontSize: token.global.font.size.huge,
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	fontFamily: token.global.font.family.brand,
	flexDirection: "row",
	gap: token.global.spacing.none,
	paddingTop: token.global.spacing.large
});

export const requiredMark = style({
	fontWeight: token.global.font.weight.medium,
	color: token.theme.color.text.danger,
	fontSize: token.global.font.size.medium,
	lineHeight: token.global.font.lineHeight.none
});
