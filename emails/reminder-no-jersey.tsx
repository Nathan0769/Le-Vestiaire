import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

/** Textes déjà traduits dans la langue du compte (messages/*.json, `Emails`). */
export interface ReminderNoJerseyTexts {
  preview: string;
  tagline: string;
  kicker: string;
  title: string;
  intro: string;
  features: { title: string; text: string }[];
  stepsTitle: string;
  steps: string[];
  cta: string;
  footerReason: string;
  unsubscribe: string;
}

interface ReminderNoJerseyEmailProps {
  lang: string;
  texts: ReminderNoJerseyTexts;
  ctaUrl: string;
  unsubscribeUrl: string;
}

/**
 * Logo (icône de l'app iOS, 168 px pour un affichage net à 56 px), envoyé par
 * scripts/emails/upload-logo.ts. Même URL pour tous, sans paramètre : ce n'est
 * pas un pixel de suivi (CNIL), et rien n'est mesuré à son chargement.
 */
export const EMAIL_LOGO_URL = "https://pub-ad003198168b4f5c8a2c78eb57da8afd.r2.dev/logo-app/logo-email.png";

// Aucun pixel ni lien de suivi (CNIL) : le logo est la seule image, liens nus uniquement
export function ReminderNoJerseyEmail({ lang, texts, ctaUrl, unsubscribeUrl }: ReminderNoJerseyEmailProps) {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{texts.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Img src={EMAIL_LOGO_URL} width="56" height="56" alt="Le Vestiaire" style={logo} />
            <Text style={wordmark}>LE VESTIAIRE</Text>
            <Text style={tagline}>{texts.tagline}</Text>
          </Section>

          <Section style={hero}>
            <Text style={kicker}>{texts.kicker}</Text>
            <Text style={title}>{texts.title}</Text>
            <Text style={lead}>{texts.intro}</Text>
          </Section>

          <Section style={featuresWrap}>
            {texts.features.map((feature) => (
              <Row key={feature.title} style={featureRow}>
                <Column style={featureMark} />
                <Column style={featureBody}>
                  <Text style={featureTitle}>{feature.title}</Text>
                  <Text style={featureText}>{feature.text}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Marge latérale sur un bloc parent : une section est un tableau à 100 %, une marge la ferait déborder */}
          <Section style={stepsOuter}>
            <Section style={stepsWrap}>
            <Text style={stepsTitle}>{texts.stepsTitle}</Text>
            {texts.steps.map((step, index) => (
              <Row key={step} style={stepRow}>
                <Column style={stepNumberCol}>
                  <div style={stepNumber}>{index + 1}</div>
                </Column>
                <Column>
                  <Text style={stepText}>{step}</Text>
                </Column>
              </Row>
            ))}
            </Section>
          </Section>

          <Section style={ctaWrap}>
            <Button style={button} href={ctaUrl}>
              {texts.cta}
            </Button>
          </Section>

          <Section style={footerWrap}>
            <Hr style={hr} />
            <Text style={footer}>
              {texts.footerReason}{" "}
              <Link href={unsubscribeUrl} style={footerLink}>
                {texts.unsubscribe}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ReminderNoJerseyEmail;

// Couleurs de l'icône iOS : fond bleu nuit, trait or
const NAVY = "#0a1530";
const GOLD = "#c9a84c";
const CREAM = "#f3ecdc";

const main: React.CSSProperties = {
  backgroundColor: "#eceef2",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  padding: "24px 0",
};
const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "560px",
  borderRadius: "16px",
  overflow: "hidden",
};
const header: React.CSSProperties = {
  backgroundColor: NAVY,
  padding: "28px 28px 22px",
  textAlign: "center",
};
const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto 12px",
  borderRadius: "12px",
  // Visible si les images sont bloquées (Outlook par défaut)
  color: CREAM,
  fontSize: "14px",
  fontWeight: 700,
};
const wordmark: React.CSSProperties = {
  margin: 0,
  color: GOLD,
  fontSize: "15px",
  fontWeight: 800,
  letterSpacing: "4px",
};
const tagline: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#aeb8c8",
  fontSize: "13px",
  lineHeight: "18px",
};
const hero: React.CSSProperties = { padding: "30px 32px 6px" };
const kicker: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#9a7d2e",
};
const title: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "26px",
  lineHeight: "1.2",
  fontWeight: 800,
  color: "#0f1a15",
};
const lead: React.CSSProperties = {
  margin: 0,
  fontSize: "15.5px",
  lineHeight: "25px",
  color: "#45524b",
};
const featuresWrap: React.CSSProperties = { padding: "18px 32px 4px" };
const featureRow: React.CSSProperties = { marginBottom: "14px" };
const featureMark: React.CSSProperties = {
  width: "4px",
  backgroundColor: GOLD,
  borderRadius: "2px",
};
const featureBody: React.CSSProperties = { paddingLeft: "14px" };
const featureTitle: React.CSSProperties = {
  margin: "0 0 2px",
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f1a15",
};
const featureText: React.CSSProperties = {
  margin: 0,
  fontSize: "14.5px",
  lineHeight: "22px",
  color: "#45524b",
};
const stepsOuter: React.CSSProperties = { padding: "14px 32px 0" };
const stepsWrap: React.CSSProperties = {
  padding: "18px 20px 8px",
  backgroundColor: "#f2f4f7",
  borderRadius: "12px",
};
const stepsTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: NAVY,
};
const stepRow: React.CSSProperties = { marginBottom: "10px" };
const stepNumberCol: React.CSSProperties = { width: "36px", verticalAlign: "top" };
const stepNumber: React.CSSProperties = {
  width: "24px",
  height: "24px",
  lineHeight: "24px",
  borderRadius: "12px",
  backgroundColor: NAVY,
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: 700,
  textAlign: "center",
};
const stepText: React.CSSProperties = {
  margin: 0,
  fontSize: "14.5px",
  lineHeight: "24px",
  color: "#27332d",
};
const ctaWrap: React.CSSProperties = { padding: "26px 32px 8px", textAlign: "center" };
const button: React.CSSProperties = {
  backgroundColor: NAVY,
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "14px 28px",
};
const footerWrap: React.CSSProperties = { padding: "28px 32px 28px" };
const hr: React.CSSProperties = { borderColor: "#e3e6ec", margin: "0 0 18px" };
const footer: React.CSSProperties = {
  margin: 0,
  fontSize: "12.5px",
  lineHeight: "19px",
  color: "#8a968f",
};
const footerLink: React.CSSProperties = { color: "#8a968f" };
