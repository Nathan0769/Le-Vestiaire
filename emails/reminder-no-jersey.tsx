import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface ReminderNoJerseyEmailProps {
  userName: string;
  unsubscribeUrl: string;
  appUrl: string;
}

export function ReminderNoJerseyEmail({
  userName,
  unsubscribeUrl,
  appUrl,
}: ReminderNoJerseyEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Ajoute ton premier maillot à ta collection</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Le Vestiaire</Heading>

          <Section style={section}>
            <Text style={text}>
              Salut {userName},
            </Text>
            <Text style={text}>
              Tu t&apos;es inscrit sur Le Vestiaire il y a quelques jours, mais ta collection est encore vide.
            </Text>
            <Text style={text}>
              Ajoute ton premier maillot en quelques secondes et commence à construire ta vitrine de collectionneur.
            </Text>

            <Button style={button} href={`${appUrl}/collection`}>
              Ajouter mon premier maillot
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Tu reçois cet email car tu es inscrit sur Le Vestiaire.{" "}
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Se désabonner
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ReminderNoJerseyEmail;

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

const unsubscribeLink: React.CSSProperties = {
  color: "#9ca3af",
};
