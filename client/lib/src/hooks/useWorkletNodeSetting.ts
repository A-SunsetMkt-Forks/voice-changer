import { useState, useMemo, useEffect } from "react"

import { DefaultWorkletNodeSetting, INDEXEDDB_KEY_WORKLETNODE, WorkletNodeSetting } from "../const"
import { VoiceChangerClient } from "../VoiceChangerClient"
import { useIndexedDB } from "./useIndexedDB"

export type UseWorkletNodeSettingProps = {
    voiceChangerClient: VoiceChangerClient | null
}

export type WorkletNodeSettingState = {
    workletNodeSetting: WorkletNodeSetting;
    clearSetting: () => Promise<void>
    updateWorkletNodeSetting: (setting: WorkletNodeSetting) => void
    startOutputRecording: () => void
    stopOutputRecording: () => Promise<Float32Array>
    trancateBuffer: () => Promise<void>

}

export const useWorkletNodeSetting = (props: UseWorkletNodeSettingProps): WorkletNodeSettingState => {
    const [workletNodeSetting, _setWorkletNodeSetting] = useState<WorkletNodeSetting>(DefaultWorkletNodeSetting)
    const { setItem, getItem, removeItem } = useIndexedDB()

    // 初期化 その１ DBから取得
    useEffect(() => {
        const loadCache = async () => {
            const setting = await getItem(INDEXEDDB_KEY_WORKLETNODE) as WorkletNodeSetting
            if (setting) {
                _setWorkletNodeSetting(setting)
            }
        }
        loadCache()
    }, [])

    // 初期化 その２ クライアントに設定
    useEffect(() => {
        if (!props.voiceChangerClient) return
        props.voiceChangerClient.setServerUrl(workletNodeSetting.serverUrl)
        props.voiceChangerClient.updateWorkletNodeSetting(workletNodeSetting)
    }, [props.voiceChangerClient])



    const clearSetting = async () => {
        await removeItem(INDEXEDDB_KEY_WORKLETNODE)
    }

    //////////////
    // 設定
    /////////////

    const updateWorkletNodeSetting = useMemo(() => {
        return (_workletNodeSetting: WorkletNodeSetting) => {
            if (!props.voiceChangerClient) return
            for (let k in _workletNodeSetting) {
                const cur_v = workletNodeSetting[k as keyof WorkletNodeSetting]
                const new_v = _workletNodeSetting[k as keyof WorkletNodeSetting]
                if (cur_v != new_v) {
                    _setWorkletNodeSetting(_workletNodeSetting)
                    setItem(INDEXEDDB_KEY_WORKLETNODE, _workletNodeSetting)
                    props.voiceChangerClient.updateWorkletNodeSetting(_workletNodeSetting)
                    break
                }
            }
        }
    }, [props.voiceChangerClient, workletNodeSetting])

    const startOutputRecording = useMemo(() => {
        return () => {
            if (!props.voiceChangerClient) return
            props.voiceChangerClient.startOutputRecording()
        }
    }, [props.voiceChangerClient])

    const stopOutputRecording = useMemo(() => {
        return async () => {
            if (!props.voiceChangerClient) return new Float32Array()
            return props.voiceChangerClient.stopOutputRecording()
        }
    }, [props.voiceChangerClient])

    const trancateBuffer = useMemo(() => {
        return async () => {
            if (!props.voiceChangerClient) return
            props.voiceChangerClient.trancateBuffer()
        }
    }, [props.voiceChangerClient])


    return {
        workletNodeSetting,
        clearSetting,
        updateWorkletNodeSetting,
        startOutputRecording,
        stopOutputRecording,
        trancateBuffer
    }
}