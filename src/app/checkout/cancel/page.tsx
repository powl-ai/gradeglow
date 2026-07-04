import CheckoutResultPage from "../../../components/CheckoutResultPage";

type CheckoutRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const readFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default async function CheckoutCancelRoute({ searchParams }: CheckoutRouteProps) {
  const params = await searchParams;
  return (
    <CheckoutResultPage
      result="cancel"
      isPreview={readFirstParam(params?.preview) === "1"}
      cycle={readFirstParam(params?.cycle)}
    />
  );
}
