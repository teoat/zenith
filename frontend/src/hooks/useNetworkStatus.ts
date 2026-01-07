import { useContext } from "react";
import { NetworkStatusContext } from "@/context/NetworkStatusContext";

export const useNetworkStatus = () => useContext(NetworkStatusContext);
