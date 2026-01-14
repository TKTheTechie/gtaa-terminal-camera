/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as solace from 'solclientjs';
import { v4 as uuidv4 } from 'uuid';


/**
 * The SubscriptionObject represents a combination of the callback function and
 *  whether the subscription has been applied on the PubSub+ broker
 *  @author TKTheTechie
 */
class SubscriptionObject {
	callback: any;
	isSubscribed: boolean;

	constructor(_callback: any, _isSubscribed: boolean) {
		this.callback = _callback;
		this.isSubscribed = _isSubscribed;
	}
}

//Convenience wrapper class to simplify Solace operations
class AsyncSolaceClient {
	//Solace session object
	private session: solace.Session | null = null;

	private messageConsumer: solace.MessageConsumer | null = null;

	//Map that holds the topic subscription string and the associated callback function, subscription state
	private topicSubscriptions: Map<string, SubscriptionObject> = new Map<
		string,
		SubscriptionObject
	>();

	private isConsuming = false;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	constructor() {
		//Initializing the solace client library
		//@ts-ignore
		const factoryProps = new solace.SolclientFactoryProperties();
		factoryProps.profile = solace.SolclientFactoryProfiles.version10;
		solace.SolclientFactory.init(factoryProps);
	}
	/**
	 * Asynchronous function that connects to the Solace Broker and returns a promise.
	 * Only required if a session isn't passed directly to this class
	 */
	connect(): Promise<string> {
		return new Promise((resolve, reject) => {
			const url = import.meta.env.VITE_SOLACE_URL;
			const vpnName = import.meta.env.VITE_SOLACE_VPN;
			const userName = import.meta.env.VITE_SOLACE_USER;
			const password = import.meta.env.VITE_SOLACE_PASSWORD;

			if (this.session != undefined) {
				console.warn('Already connected and ready to subscribe.');
			} else {
				// if there's no session, create one with the properties imported from the game-config file
				try {
					if (url.indexOf('ws') != 0) {
						reject(
							'HostUrl must be the WebMessaging Endpoint that begins with either ws:// or wss://. Please set appropriately!'
						);
						return;
					}

					this.session = solace.SolclientFactory.createSession({
						url,
						vpnName,
						userName,
						password,
						connectRetries: 3,
						publisherProperties: {
							enabled: true,
							acknowledgeMode: solace.MessagePublisherAcknowledgeMode.PER_MESSAGE
						}
					});
				} catch (error: unknown) {
					console.log(String(error));
				}
				// define session event listeners

				//The UP_NOTICE dictates whether the session has been established
				this.session?.on(solace.SessionEventCode.UP_NOTICE, () => {
					console.log('=== Successfully connected and ready to subscribe. ===');
					resolve('Connected');
				});

				//The CONNECT_FAILED_ERROR implies a connection failure
				this.session?.on(
					solace.SessionEventCode.CONNECT_FAILED_ERROR,
					(sessionEvent: solace.SessionEvent) => {
						console.log(
							'Connection failed to the message router: ' +
								sessionEvent.infoStr +
								' - check correct parameter values and connectivity!'
						);
						reject(`Check your connection settings and try again!`);
					}
				);

				//Message callback function
				this.session?.on(solace.SessionEventCode.MESSAGE, (message: solace.Message) => {
					//Get the topic name from the message's destination
					const destination = message.getDestination();
					if (!destination) return;
					const topicName: string = destination.getName();
					//Iterate over all subscriptions in the subscription map
					for (const sub of Array.from(this.topicSubscriptions.keys())) {
						//Replace all * in the topic filter with a .* to make it regex compatible
						let regexdSub = sub.replace(/\*/g, '.*');

						//if the last character is a '>', replace it with a .* to make it regex compatible
						if (sub.lastIndexOf('>') == sub.length - 1)
							regexdSub = regexdSub.substring(0, regexdSub.length - 1).concat('.*');

						const matched = topicName.match(regexdSub);

						//if the matched index starts at 0, then the topic is a match with the topic filter
						if (matched && matched.index == 0) {
							//Edge case if the pattern is a match but the last character is a *
							if (regexdSub.lastIndexOf('*') == sub.length - 1) {
								//Check if the number of topic sections are equal
								if (regexdSub.split('/').length != topicName.split('/').length) return;
							}
							//Proceed with the message callback for the topic subscription if the subscription is active
							const subscription = this.topicSubscriptions.get(sub);
							if (subscription && subscription.isSubscribed && subscription.callback != null) {
								subscription.callback(message);
							}
						}
					}
				});

				// connect the session
				try {
					this.session?.connect();
				} catch (error: unknown) {
					console.log(String(error));
				}
			}
		});
	}

	async disconnect() {
		return new Promise<void>((resolve) => {
			console.log('Disconnecting from Solace message router...');

			if (!this.session) {
				console.log('Not connected to Solace message router.');
				resolve();
				return;
			}

			//DISCONNECTED implies the client was disconnected
			this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
				console.log('Disconnected.');
				if (this.session !== null) {
					this.session.dispose();
					this.session = null;
					resolve();
				}
			});
			
			try {
				this.session.disconnect();
			} catch (error: unknown) {
				console.log(String(error));
			}
		});
	}

	/**
	 * Convenience function to consume from a queue
	 *
	 * @param queueName Name of the queue to consume from
	 */
	consumeFromQueue(queueName: string) {
		if (this.session == null) {
			console.log('Not connected to Solace!');
			return;
		}
		
		if (this.isConsuming) {
			console.warn(`Already connected to the queue ${queueName}`);
			return;
		}
		
		this.messageConsumer = this.session.createMessageConsumer({
			queueDescriptor: { name: queueName, type: solace.QueueType.QUEUE },
			acknowledgeMode: solace.MessageConsumerAcknowledgeMode.CLIENT,
			createIfMissing: true
		});

				this.messageConsumer.on(solace.MessageConsumerEventName.UP, () => {
					console.log('Succesfully connected to and consuming from ' + queueName);
				});

				this.messageConsumer.on(solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, () => {
					console.log('Consumer cannot bind to queue ' + queueName);
				});

				this.messageConsumer.on(solace.MessageConsumerEventName.DOWN, () => {
					console.log('The message consumer is down');
				});

				this.messageConsumer.on(solace.MessageConsumerEventName.DOWN_ERROR, () => {
					console.log('An error happend, the message consumer is down');
				});

		try {
			this.messageConsumer.connect();
			this.isConsuming = true;
		} catch (err) {
			console.log(
				'Cannot start the message consumer on queue ' + queueName + ' because: ' + err
			);
		}
	}

	/**
	 * Function that adds a subscription to a queue
	 * @param topicSubscription - topic subscription string to add to the queue
	 */
	public addSubscriptionToQueue(topicSubscription: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.messageConsumer) {
				reject('Message consumer not initialized');
				return;
			}
			const correlationKey = uuidv4();
			this.resolveRejectSubscriptionFunctions(correlationKey, resolve, reject);
			this.messageConsumer.addSubscription(
				solace.SolclientFactory.createTopicDestination(topicSubscription),
				correlationKey,
				1000
			);
		});
	}

	/**
	 * Function that removes a topic subscription from a queue
	 * @param topicSubscription Topic to be removed from the queue
	 */
	public removeSubscriptionFromQueue(topicSubscription: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.messageConsumer) {
				reject('Message consumer not initialized');
				return;
			}
			const correlationKey = uuidv4();
			this.resolveRejectSubscriptionFunctions(correlationKey, resolve, reject);
			this.messageConsumer.removeSubscription(
				solace.SolclientFactory.createTopicDestination(topicSubscription),
				correlationKey,
				1000
			);
		});
	}

	/**
	 * Convenience function to resolve or reject subscription actions based on the co-relationkey
	 * @param correlationKey the unique identifier for the subscription action
	 * @param resolve the resolve function
	 * @param reject the reject function
	 */
	private resolveRejectSubscriptionFunctions(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		correlationKey: string,
		resolve: (value: void | PromiseLike<void>) => void,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		reject: (reason?: any) => void
	) {
		//The function to be called if the Ack happends
		const onAck = (evt: solace.SessionEvent) => {
			if (!evt || String(evt.correlationKey) !== correlationKey) return;
			//@ts-ignore
			this.session?.removeListener(solace.SessionEventCode.SUBSCRIPTION_OK, onAck);
			//@ts-ignore
			this.session?.removeListener(solace.SessionEventCode.SUBSCRIPTION_ERROR, onNak);
			resolve();
		};

		//The function to be called if the action is rejected
		const onNak = (evt: solace.MessageConsumerEvent) => {
			if (!evt || String(evt.correlationKey) !== correlationKey) return;
			//@ts-ignore
			this.session?.removeListener(solace.SessionEventCode.SUBSCRIPTION_OK, onAck);
			//@ts-ignore
			this.session?.removeListener(solace.SessionEventCode.SUBSCRIPTION_ERROR, onNak);
			reject();
		};

		//Add the relevant events
		//@ts-ignore
		this.session?.addListener(solace.SessionEventCode.SUBSCRIPTION_OK, onAck);
		//@ts-ignore
		this.session?.addListener(solace.SessionEventCode.SUBSCRIPTION_ERROR, onNak);
	}

	/**
	 *
	 * @param queueName Name of the queue to consume from
	 */
	stopConsumeFromQueue() {
		if (this.isConsuming && this.messageConsumer) {
			this.messageConsumer.stop();
			this.isConsuming = false;
		}
	}

	/**
	 * Publish a guaranteed message on a topic
	 * @param topic Topic to publish on
	 * @param payload Payload on the topic
	 */
	async publishGuaranteedMessage(topic: string, payload: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.session) {
				console.log('Cannot publish because not connected to Solace message router!');
				reject();
				return;
			}

			const binaryAttachment = new Blob([payload], {
				type: 'text/plain; charset=utf-8'
			}).arrayBuffer();
			const message = solace.SolclientFactory.createMessage();
			message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
			binaryAttachment.then((buffer) => {
				const correlationKey = uuidv4();

				message.setCorrelationKey(correlationKey);
				message.setBinaryAttachment(new Uint8Array(buffer));
				message.setDeliveryMode(solace.MessageDeliveryModeType.PERSISTENT);

				//call to be made on succesful publish
				const onAck = (evt: solace.SessionEvent) => {
					if (!evt || String(evt.correlationKey) !== correlationKey) {
						return;
					}
					//@ts-ignore
					this.session?.removeListener(String(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE), onAck);
					//@ts-ignore
					this.session?.removeListener(
						String(solace.SessionEventCode.REJECTED_MESSAGE_ERROR),
						onNak
					);
					resolve();
				};

				//call to be made on rejected publish
				const onNak = (evt: solace.SessionEvent) => {
					console.log('Unsuccesfully published!');
					if (!evt || String(evt.correlationKey) !== correlationKey) {
						return;
					}
					//@ts-ignore
					this.session?.removeListener(String(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE), onAck);
					//@ts-ignore
					this.session?.removeListener(
						String(solace.SessionEventCode.REJECTED_MESSAGE_ERROR),
						onNak
					);
					reject();
				};

				try {
					//register the callbacks on publish
					this.session?.on(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE, onAck);
					this.session?.on(solace.SessionEventCode.REJECTED_MESSAGE_ERROR, onNak);
					this.session?.send(message);
				} catch (error: unknown) {
					//remove the callbacks on error
					//@ts-ignore
					this.session?.removeListener(String(solace.SessionEventCode.ACKNOWLEDGED_MESSAGE), onAck);
					//@ts-ignore
					this.session?.removeListener(
						String(solace.SessionEventCode.REJECTED_MESSAGE_ERROR),
						onNak
					);
					console.log(error);
					reject();
				}
			});
		});
	}

	sendRequest(topic: string, payload: string): Promise<string> {
		return new Promise((resolve, reject) => {
			if (!this.session) {
				reject('Not connected to Solace session');
				return;
			}

			const binaryAttachment = new Blob([payload], {
				type: 'text/plain; charset=utf-8'
			}).arrayBuffer();

			const message = solace.SolclientFactory.createMessage();
			message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
			binaryAttachment.then((buffer) => {
				message.setBinaryAttachment(new Uint8Array(buffer));
				message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
				try {
					console.log('Sending game session join request');
					this.session?.sendRequest(
						message,
						2000,
						(_session: solace.Session, msg: solace.Message) => {
							const attachment = msg.getBinaryAttachment();
							if (!attachment) {
								reject('No binary attachment in response');
								return;
							}
							// Convert to proper type for Blob
							let uint8Array: Uint8Array;
							if (attachment instanceof Uint8Array) {
								uint8Array = attachment;
							} else if (typeof attachment === 'string') {
								const encoder = new TextEncoder();
								uint8Array = encoder.encode(attachment);
							} else {
								uint8Array = new Uint8Array(attachment as unknown as ArrayBuffer);
							}
							const blob = new Blob([uint8Array as Uint8Array<ArrayBuffer>], {
								type: 'text/plain; charset=utf-8'
							});
							blob.text().then((text) => {
								console.log('Joining game session...');
								resolve(text);
							});
						},
						(_session: solace.Session, error: solace.RequestError) => {
							console.log(error);
							reject(error);
						}
					);
				} catch (error: unknown) {
					console.log(error);
					reject(error);
				}
			});
		});
	}

	/**
	 * Publish a direct message on a topic
	 * @param topic Topic to publish on
	 * @param payload Payload on the topic
	 */
	publishDirectMessage(topic: string, payload: string) {
		if (!this.session) {
			return;
		}

		const binaryAttachment = new Blob([payload], {
			type: 'text/plain; charset=utf-8'
		}).arrayBuffer();

		const message = solace.SolclientFactory.createMessage();
		message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
		binaryAttachment.then((buffer) => {
			message.setBinaryAttachment(new Uint8Array(buffer));
			message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
			try {
				this.session?.send(message);
			} catch (error: unknown) {
				console.log('unable to publish message:', error);
			}
		});
	}

	public unsubscribe(topic: string): Promise<void> {
		return new Promise((resolve, reject) => {
			//Check if the session has been established
			if (!this.session) {
				console.error('Cannot subscribe because not connected to Solace message router!');
				reject();
				return;
			}
			//Check if the subscription already exists
			if (!this.topicSubscriptions.get(topic)) {
				console.warn(`Not subscribed to ${topic}.`);
				reject();
				return;
			}
			const correlationKey = uuidv4();
			this.resolveRejectSubscriptionFunctions(correlationKey, resolve, reject);

			console.info(`Unsubscribing from ${topic}...`);
			this.session.unsubscribe(
				solace.SolclientFactory.createTopicDestination(topic),
				true,
				correlationKey,
				1000
			);
		});
	}

	/**
	 * Function that adds a subscription to a queue
	 * @param topicSubscription - topic subscription string to add to the queue
	 * @param callback - callback function for messages
	 */
	public subscribe(topicSubscription: string, callback: any): Promise<void> {
		return new Promise((resolve, reject) => {
			//Check if the session has been established
			if (!this.session) {
				console.error('Cannot subscribe because not connected to Solace message router!');
				reject();
				return;
			}
			//Check if the subscription already exists
			if (this.topicSubscriptions.get(topicSubscription)) {
				console.warn(`Already subscribed to ${topicSubscription}.`);
				reject();
				return;
			}
			console.info(`Subscribing to ${topicSubscription}`);
			const correlationKey = uuidv4();
			this.resolveRejectSubscriptionFunctions(correlationKey, resolve, reject);
			this.session.subscribe(
				solace.SolclientFactory.createTopicDestination(topicSubscription),
				true,
				correlationKey,
				1000
			);
		});
	}

	private directMessageSubscribe(topic: string, callback: any) {
		this.subscribe(topic, callback).then(() => {
			//Create a subscription object with the callback, upon succesful subscription, the object will be updated
			const subscriptionObject: SubscriptionObject = new SubscriptionObject(callback, true);
			this.topicSubscriptions.set(topic, subscriptionObject);
			console.log(`Subscribed to ${topic}`);
		});
	}

	private directMessageUnsubscribe(topic: string) {
		this.unsubscribe(topic).then(() => {
			this.topicSubscriptions.delete(topic);
			console.log(`Unsubscribed from ${topic}`);
		});
	}





}

const SolaceClient = new AsyncSolaceClient();

export default SolaceClient;