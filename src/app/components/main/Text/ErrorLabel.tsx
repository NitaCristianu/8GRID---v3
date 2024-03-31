export default function ErrorLabel(props : {error : unknown| string | undefined}){
    return <p>{String(props.error)}</p>
}