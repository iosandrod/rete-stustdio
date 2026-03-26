import { RenderEmit, Presets } from 'rete-react-plugin'
import { Schemes } from 'rete-studio-core'

type NodeExtraData = { width?: number, height?: number }

const { RefSocket, RefControl } = Presets.classic;

function sortByIndex<T extends [string, undefined | { index?: number }][]>(entries: T) {
    entries.sort((a, b) => {
        const ai = a[1]?.index || 0
        const bi = b[1]?.index || 0

        return ai - bi
    })
}

export const selectedShadow = '0px 2px 6px 2px #985700, 0 0 0px 5px #c9b144;'

type Props<S extends Schemes> = {
    data: S['Node'] & NodeExtraData
    styles?: () => any
    emit: RenderEmit<S>
}

export type NodeComponent<Scheme extends Schemes> = (props: Props<Scheme>) => JSX.Element

export function Node<Scheme extends Schemes>(props: Props<Scheme>) {
    const inputs = Object.entries(props.data.inputs)
    const outputs = Object.entries(props.data.outputs)
    const controls = Object.entries(props.data.controls)
    const selected = props.data.selected || false

    sortByIndex(inputs)
    sortByIndex(outputs)
    sortByIndex(controls)

    const nodeClasses = [
        'relative',
        'min-w-0',
        'border',
        'border-black',
        'rounded-[20px]',
        selected ? 'shadow-[0px_2px_6px_2px_#985700,0_0_0px_5px_#c9b144]' : 'shadow-[0_5px_5px_1px_rgba(0,0,0,0.3)]',
        'bg-[hsla(0,0%,6%,0.55)]',
        'z-10',
    ].join(' ')

    return (
        <div
            className={nodeClasses}
            style={{ width: props.data.width, height: props.data.height }}
        >
            {/* Glossy overlay */}
            <div
                className="absolute top-0 left-0 right-0 bottom-0 rounded-inherit border-t border-t-white/[0.7] bg-gradient-to-b from-white/[0.25] from-0 via-white/[0.21] via-3px via-white/[0.14] via-6px via-white/[0.1] via-9px via-white/[0.1] via-13px to-transparent"
                style={{ zIndex: -1 }}
            />

            {/* Title */}
            <div className="whitespace-nowrap bg-[radial-gradient(50%_90%,#3f80c39e_0%,transparent_80%)] font-['Montserrat'] font-light text-[20px] p-1 rounded-t-[15px] text-center overflow-hidden text-ellipsis">
                {props.data.label}
            </div>

            {/* Columns */}
            <div className="flex">
                {/* Inputs column */}
                <div className="flex-1 overflow-hidden">
                    {inputs.map(([key, input]) => (
                        input && (
                            <div className="flex items-center" key={key}>
                                <div className="relative z-20 ml-1">
                                    <RefSocket
                                        name="input-socket"
                                        side="input"
                                        socketKey={key}
                                        nodeId={props.data.id}
                                        emit={props.emit}
                                        payload={input.socket}
                                        data-testid="input-socket"
                                    />
                                </div>
                                {input && (!input.control || !input.showControl) && (
                                    <div className="text-white font-['Montserrat'] font-light text-sm overflow-hidden text-ellipsis">
                                        {input?.label}
                                    </div>
                                )}
                                {input?.control && input?.showControl && (
                                    <RefControl
                                        key={key}
                                        name="input-control"
                                        emit={props.emit}
                                        payload={input.control}
                                        data-testid="input-control"
                                    />
                                )}
                            </div>
                        )
                    ))}
                </div>

                {/* Outputs column */}
                <div className="flex-1 overflow-hidden">
                    {outputs.map(([key, output]) => (
                        output && (
                            <div className="flex items-center justify-end" key={key}>
                                {!output?.control && (
                                    <div className="text-white font-['Montserrat'] font-light text-sm overflow-hidden text-ellipsis">
                                        {output?.label}
                                    </div>
                                )}
                                {output?.control && (
                                    <RefControl
                                        key={key}
                                        name="output-control"
                                        emit={props.emit}
                                        payload={output.control}
                                        data-testid="output-control"
                                    />
                                )}
                                <div className="relative z-20 mr-1">
                                    <RefSocket
                                        name="output-socket"
                                        side="output"
                                        socketKey={key}
                                        nodeId={props.data.id}
                                        emit={props.emit}
                                        payload={output.socket}
                                        data-testid="output-socket"
                                    />
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="controls">
                {controls.map(([key, control]) => {
                    return control ? (
                        <RefControl
                            key={key}
                            name="control"
                            emit={props.emit}
                            payload={control}
                            data-testid={`control-${key}`}
                        />
                    ) : null;
                })}
            </div>
        </div>
    )
}
