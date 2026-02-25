import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  return (
    <>
      <h1>Status</h1>
      <UpdatedAt isLoading={isLoading} data={data} />
      <DatabaseStatus isLoading={isLoading} data={data} />
    </>
  );
}

function UpdatedAt({ isLoading, data }) {
  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
  }

  return <div>Última Atualização: {updatedAtText}</div>;
}

function DatabaseStatus({ isLoading, data }) {
  if (isLoading || !data) {
    return <div>Carregando informações do banco...</div>;
  }

  const db = data?.dependencies?.database;

  if (!db) {
    return <div>Dados do banco de dados indisponíveis</div>;
  }

  const percent =
    db.max_connections > 0
      ? Math.round((db.used_connections / db.max_connections) * 100)
      : 0;

  return (
    <div>
      <h2>Database</h2>
      <ul>
        <li>Versão do PostgreSQL: {db.version}</li>
        <li>Máximo de conexões: {db.max_connections}</li>
        <li>Conexões usadas: {db.used_connections}</li>
        <li>Uso: {percent}%</li>
      </ul>
    </div>
  );
}
