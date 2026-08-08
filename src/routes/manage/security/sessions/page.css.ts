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
	width: "fit-content",
	// Ensure the card doesn't overflow viewport on small devices
	maxWidth: "100%",
	backgroundColor: token.theme.color.surface.default.normal,
	border: `${token.global.borderWidth.standard} solid ${token.theme.color.border.default}`,
	borderRadius: token.global.radius.xlarge,
	padding: token.global.spacing.xlarge,
	transition: `border-color ${token.global.transition.duration.standard} ${token.global.transition.timing.ease}`,
	boxSizing: "border-box"
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

export const tableContainer = style({
	marginTop: token.global.spacing.xlarge,
	overflowX: "auto"
});

export const table = style({
	width: "100%",
	borderCollapse: "collapse",
	textAlign: "left",
	color: token.theme.color.text.default
});

// -- New Mobile Styles -- //

export const mobileList = style({
	display: "flex",
	flexDirection: "column",
	gap: token.global.spacing.medium
});

export const mobileSessionCard = style({
	display: "flex",
	flexDirection: "column",
	gap: token.global.spacing.xsmall,
	paddingTop: token.global.spacing.small,
	paddingBottom: token.global.spacing.small,
	color: token.theme.color.text.default
});

export const mobileSessionLabel = style({
	fontWeight: token.global.font.weight.bold,
	color: token.theme.color.text.default,
	marginRight: token.global.spacing.xsmall,
	display: "inline-block",
	minWidth: "90px" // Aligns the labels nicely on the left
});
