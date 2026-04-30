import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ResetPasswordEmailProps {
  url: string;
}

export function ResetPasswordEmail({ url }: ResetPasswordEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Réinitialisez votre mot de passe Le Vestiaire</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Le Vestiaire</Heading>

          <Section style={section}>
            <Text style={text}>
              Vous avez demandé à réinitialiser votre mot de passe.
            </Text>
            <Text style={text}>
              Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable 1 heure.
            </Text>
            <Text style={text}>
              Si vous n&apos;avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.
            </Text>

            <Button style={button} href={url}>
              Réinitialiser mon mot de passe
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Le Vestiaire — La communauté des collectionneurs de maillots.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#111827",
  marginBottom: "32px",
};

const section: React.CSSProperties = {
  marginBottom: "32px",
};

const text: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#374151",
  margin: "0 0 16px",
};

const button: React.CSSProperties = {
  backgroundColor: "#111827",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center",
  display: "block",
  padding: "12px 24px",
  marginTop: "24px",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "32px 0 24px",
};

const footer: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#9ca3af",
};
