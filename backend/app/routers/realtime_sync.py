import asyncio
import json
import logging
from dataclasses import asdict
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect

from app.services.integration.collaboration.sync_service import CRDTDocument, sync_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sync", tags=["realtime-sync"])


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time collaboration with authentication"""
    try:
        # Accept connection first to allow sending error messages
        await websocket.accept()

        # Extract token from query parameters
        query_params = websocket.query_params
        token = query_params.get("token")

        if not token:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication token required"
            })
            await websocket.close(code=1008, reason="Authentication required")
            return

        # Validate JWT token
        try:
            from app.services.infrastructure.auth_service import auth_service
            payload = auth_service.decode_token(token)
            token_user_id = payload.get("sub")

            # Verify token belongs to requested user
            if token_user_id != user_id:
                await websocket.send_json({
                    "type": "error",
                    "message": "Token does not match user ID"
                })
                await websocket.close(code=1008, reason="Authentication failed")
                return

            # Check MFA if required
            mfa_verified = payload.get("mfa_verified", False)
            if not mfa_verified:
                await websocket.send_json({
                    "type": "error",
                    "message": "MFA verification required"
                })
                await websocket.close(code=1008, reason="MFA required")
                return

        except Exception as e:
            logger.error(f"WebSocket authentication failed: {e}")
            await websocket.send_json({
                "type": "error",
                "message": "Invalid authentication token"
            })
            await websocket.close(code=1008, reason="Authentication failed")
            return
            try:
                from app.services.infrastructure.auth_service import auth_service
                payload = auth_service.decode_token(token)
                token_user_id = payload.get("sub")

                # Verify token belongs to requested user
                if token_user_id != user_id:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Token does not match user ID"
                    })
                    await websocket.close(code=1008, reason="Authentication failed")
                    return

                # Check MFA if required
                mfa_verified = payload.get("mfa_verified", False)
                if not mfa_verified:
                    await websocket.send_json({
                        "type": "error",
                        "message": "MFA verification required"
                    })
                    await websocket.close(code=1008, reason="MFA required")
                    return

            except Exception as e:
                logger.error(f"WebSocket authentication failed: {e}")
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid authentication token"
                })
                await websocket.close(code=1008, reason="Authentication failed")
                return
        else:
            # No token provided - require authentication
            await websocket.send_json({
                "type": "error",
                "message": "Authentication token required"
            })
            await websocket.close(code=1008, reason="Authentication required")
            return

        # Generate client ID
        client_id = f"{user_id}_{datetime.now().timestamp()}"

        # Register client
        await sync_manager.register_client(client_id, websocket)

        # Handle messages
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                message = json.loads(data)

                await handle_websocket_message(client_id, message)

            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for client {client_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {str(e)}")
                await sync_manager._send_to_client(
                    client_id,
                    {"type": "error", "message": f"Error processing message: {str(e)}"},
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket connection error: {str(e)}")
    finally:
        # Unregister client
        await sync_manager.unregister_client(client_id)


async def handle_websocket_message(client_id: str, message: Dict[str, Any]):
    """Handle incoming WebSocket message"""
    message_type = message.get("type")

    try:
        if message_type == "subscribe":
            # Subscribe to document updates
            document_id = message.get("document_id")
            if document_id:
                await sync_manager.subscribe_to_document(client_id, document_id)

        elif message_type == "unsubscribe":
            # Unsubscribe from document updates
            document_id = message.get("document_id")
            if document_id:
                await sync_manager.unsubscribe_from_document(client_id, document_id)

        elif message_type == "operation":
            # Handle CRDT operation
            document_id = message.get("document_id")
            operation_data = message.get("operation")

            if document_id and operation_data:
                await sync_manager.handle_operation(
                    client_id, document_id, operation_data
                )

        elif message_type == "sync":
            # Sync client with latest state
            document_id = message.get("document_id")
            client_vector_clock = message.get("vector_clock", {})

            if document_id:
                await sync_manager.sync_client(
                    client_id, document_id, client_vector_clock
                )

        elif message_type == "ping":
            # Respond to ping
            await sync_manager._send_to_client(
                client_id, {"type": "pong", "timestamp": datetime.now().isoformat()}
            )

        else:
            logger.warning(f"Unknown message type: {message_type}")
            await sync_manager._send_to_client(
                client_id,
                {"type": "error", "message": f"Unknown message type: {message_type}"},
            )

    except Exception as e:
        logger.error(f"Error handling message {message_type}: {str(e)}")
        await sync_manager._send_to_client(
            client_id,
            {"type": "error", "message": f"Error handling {message_type}: {str(e)}"},
        )


@router.get("/status")
async def get_service_status():
    """Get sync service status"""
    return {
        "status": "online",
        "service": "realtime-sync",
        "active_clients": len(sync_manager.connected_clients),
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/documents")
async def get_documents():
    """Get list of all collaborative documents"""
    try:
        documents = sync_manager.get_document_list()

        return {
            "documents": documents,
            "total_count": len(documents),
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error getting documents: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to get documents: {str(e)}"
        )


@router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get specific document details"""
    try:
        if document_id not in sync_manager.documents:
            raise HTTPException(
                status_code=404, detail=f"Document {document_id} not found"
            )

        document = sync_manager.documents[document_id]
        state = document.get_state()

        # Add additional metadata
        state.update(
            {
                "subscribers_count": sum(
                    1
                    for subs in sync_manager.client_subscriptions.values()
                    if document_id in subs
                ),
                "operations": [
                    asdict(op) for op in document.operations[-10:]
                ],  # Last 10 operations
            }
        )

        return {"document": state, "timestamp": datetime.now().isoformat()}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get document: {str(e)}")


@router.post("/documents/{document_id}/operations")
async def create_operation(document_id: str, operation_data: Dict[str, Any]):
    """Create and apply an operation to a document (HTTP fallback)"""
    try:
        # Ensure document exists
        if document_id not in sync_manager.documents:
            sync_manager.documents[document_id] = CRDTDocument(document_id)

        document = sync_manager.documents[document_id]

        # Create operation
        client_id = operation_data.get("client_id", "http_client")

        if operation_data.get("type") == "insert":
            operation = document.create_insert_operation(
                position=operation_data.get("position", 0),
                content=operation_data.get("content", ""),
                client_id=client_id,
            )
        elif operation_data.get("type") == "delete":
            operation = document.create_delete_operation(
                position=operation_data.get("position", 0),
                length=operation_data.get("length", 1),
                client_id=client_id,
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid operation type")

        # Apply operation
        if document.apply_operation(operation):
            # Broadcast to connected clients
            await sync_manager._broadcast_operation(document_id, operation)

            return {
                "message": "Operation applied successfully",
                "operation": asdict(operation),
                "document_state": document.get_state(),
            }
        else:
            return {
                "message": "Operation was already applied",
                "operation": asdict(operation),
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating operation: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create operation: {str(e)}"
        )


@router.get("/stats")
async def get_sync_stats():
    """Get real-time sync statistics"""
    try:
        stats = sync_manager.get_client_stats()

        # Add additional statistics
        stats.update(
            {
                "active_documents": len(sync_manager.documents),
                "total_operations": sum(
                    len(doc.operations) for doc in sync_manager.documents.values()
                ),
                "server_timestamp": datetime.now().isoformat(),
            }
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting sync stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/broadcast")
async def broadcast_message(message_data: Dict[str, Any]):
    """Broadcast message to all connected clients"""
    try:
        message = {
            "type": "broadcast",
            "data": message_data.get("data"),
            "timestamp": datetime.now().isoformat(),
            "server_message": True,
        }

        # Send to all connected clients
        for client_id in sync_manager.connected_clients:
            await sync_manager._send_to_client(client_id, message)

        return {
            "message": "Broadcast sent successfully",
            "recipients": len(sync_manager.connected_clients),
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error broadcasting message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to broadcast: {str(e)}")


@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a collaborative document"""
    try:
        if document_id not in sync_manager.documents:
            raise HTTPException(
                status_code=404, detail=f"Document {document_id} not found"
            )

        # Notify all subscribers
        message = {
            "type": "document_deleted",
            "document_id": document_id,
            "timestamp": datetime.now().isoformat(),
        }

        for client_id, subscriptions in sync_manager.client_subscriptions.items():
            if document_id in subscriptions:
                await sync_manager._send_to_client(client_id, message)
                subscriptions.discard(document_id)

        # Delete document
        del sync_manager.documents[document_id]

        return {
            "message": f"Document {document_id} deleted successfully",
            "timestamp": datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete document: {str(e)}"
        )
